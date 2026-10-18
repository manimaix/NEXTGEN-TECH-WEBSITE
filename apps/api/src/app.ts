import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import {
  createHmac,
  randomUUID,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import {
  enquirySchema,
  leadPatchSchema,
  type Lead,
} from "../../../packages/contracts/src/index";
import { DomainError, intake, updateLead } from "./leads";
import type { Database } from "./db";
import { registerSiteImages } from "./site-images";

export function createApp(
  db: Database,
  options: { origin: string; secret: string; local: boolean },
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  const smallJson = express.json({ limit: "32kb" });
  app.use((req, res, next) =>
    req.path.startsWith("/api/v1/admin/site-images/")
      ? next()
      : smallJson(req, res, next),
  );
  const sign = (v: string) =>
    createHmac("sha256", options.secret).update(v).digest("base64url");
  const mint = (scope: string) => {
    const body = Buffer.from(
      JSON.stringify({ scope, expires: Date.now() + 86400000 }),
    ).toString("base64url");
    return `${body}.${sign(body)}`;
  };
  const valid = (token: string, scope: string) => {
    try {
      const [body, signature] = token.split(".");
      const expected = sign(body);
      if (
        signature.length !== expected.length ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      )
        return false;
      const p = JSON.parse(Buffer.from(body, "base64url").toString());
      return p.scope === scope && p.expires > Date.now();
    } catch {
      return false;
    }
  };
  const sessions = new Map<string, { csrf: string; expires: number }>();
  const requests = new Map<string, { count: number; until: number }>();
  app.use("/api/v1", (req, res, next) => {
    res.locals.requestId = randomUUID();
    res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") !== options.origin
    )
      return next(
        new DomainError(
          403,
          "ORIGIN_DENIED",
          "This request must come from the website.",
        ),
      );
    next();
  });
  const data = (res: express.Response, value: unknown, extra = {}) =>
    res.json({
      data: value,
      meta: { requestId: res.locals.requestId, ...extra },
    });
  app.get("/api/v1/health", (_req, res) => data(res, { status: "ok" }));
  app.get("/api/v1/enquiry-session", (req, res) => {
    let scope = req.cookies.ng_scope as string | undefined;
    if (!scope || !/^[a-f0-9]{48}$/.test(scope)) {
      scope = randomBytes(24).toString("hex");
      res.cookie("ng_scope", scope, {
        httpOnly: true,
        sameSite: "strict",
        secure: !options.local,
        maxAge: 604800000,
        path: "/",
      });
    }
    data(res, {
      submissionToken: mint(scope),
      privacyNoticeVersion: "development-v1",
      mode: options.local ? "local" : "production",
    });
  });
  app.post("/api/v1/enquiries", async (req, res) => {
    const bucketKey = req.ip ?? "unknown",
      now = Date.now();
    let bucket = requests.get(bucketKey);
    if (!bucket || bucket.until < now)
      bucket = { count: 0, until: now + 60000 };
    bucket.count++;
    requests.set(bucketKey, bucket);
    if (requests.size > 1000)
      for (const [k, v] of requests) if (v.until < now) requests.delete(k);
    if (bucket.count > 20) {
      res.set("Retry-After", "60");
      throw new DomainError(
        429,
        "RATE_LIMITED",
        "Please wait a minute before trying again.",
      );
    }
    const input = enquirySchema.parse(req.body),
      scope = req.cookies.ng_scope as string;
    if (!scope || !valid(input.submissionToken, scope))
      throw new DomainError(
        403,
        "SUBMISSION_TOKEN_EXPIRED",
        "Refresh the form connection and try again.",
      );
    const key = z.string().uuid().parse(req.get("Idempotency-Key"));
    const result = await intake(db, input, scope, key);
    res.status(result.replayed ? 200 : 201);
    data(
      res,
      { reference: result.reference, status: "received" },
      { replayed: result.replayed },
    );
  });
  app.get("/api/v1/auth/session", (req, res) => {
    const s = sessions.get(req.cookies.ng_staff);
    data(
      res,
      s && s.expires > Date.now()
        ? { name: "Local owner", csrf: s.csrf, local: true }
        : null,
    );
  });
  app.post("/api/v1/auth/local", (req, res) => {
    const loopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
      req.socket.remoteAddress ?? "",
    );
    if (!options.local || !loopback)
      throw new DomainError(
        403,
        "LOCAL_ONLY",
        "Local staff access is disabled.",
      );
    const token = randomBytes(32).toString("hex"),
      csrf = randomBytes(24).toString("hex");
    sessions.set(token, { csrf, expires: Date.now() + 3600000 });
    res.cookie("ng_staff", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 3600000,
      path: "/",
    });
    data(res, { name: "Local owner", csrf, local: true });
  });
  app.use("/api/v1/admin", (req, _res, next) => {
    const session = sessions.get(req.cookies.ng_staff);
    if (!session || session.expires < Date.now())
      return next(
        new DomainError(
          401,
          "AUTH_REQUIRED",
          "Sign in to the local staff workspace.",
        ),
      );
    if (req.method !== "GET" && req.get("X-CSRF-Token") !== session.csrf)
      return next(
        new DomainError(403, "CSRF_FAILED", "Refresh your staff session."),
      );
    next();
  });
  app.post("/api/v1/auth/logout", (req, res) => {
    const s = sessions.get(req.cookies.ng_staff);
    if (s && req.get("X-CSRF-Token") !== s.csrf)
      throw new DomainError(403, "CSRF_FAILED", "Refresh your session.");
    sessions.delete(req.cookies.ng_staff);
    res.clearCookie("ng_staff");
    data(res, { signedOut: true });
  });
  app.get("/api/v1/admin/leads", async (req, res) => {
    const limit = 20;
    const offset = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(req.query.cursor ?? 0);
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const rows = (
      await db.query<Lead>(
        "SELECT * FROM leads WHERE ($1='' OR status=$1) ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $3",
        [status, limit + 1, offset],
      )
    ).rows;
    data(res, rows.slice(0, limit), {
      nextCursor: rows.length > limit ? String(offset + limit) : null,
    });
  });
  app.get("/api/v1/admin/leads/:id", async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const lead = (await db.query<Lead>("SELECT * FROM leads WHERE id=$1", [id]))
      .rows[0];
    if (!lead) throw new DomainError(404, "NOT_FOUND", "Enquiry not found.");
    const notes = (
      await db.query(
        "SELECT * FROM lead_notes WHERE lead_id=$1 ORDER BY created_at",
        [id],
      )
    ).rows;
    const history = (
      await db.query(
        "SELECT * FROM lead_events WHERE lead_id=$1 ORDER BY created_at",
        [id],
      )
    ).rows;
    data(res, { ...lead, notes, history });
  });
  app.patch("/api/v1/admin/leads/:id", async (req, res) =>
    data(
      res,
      await updateLead(
        db,
        z.string().uuid().parse(req.params.id),
        leadPatchSchema.parse(req.body),
      ),
    ),
  );
  app.post("/api/v1/admin/leads/:id/notes", async (req, res) => {
    const id = z.string().uuid().parse(req.params.id),
      text = z.string().trim().min(1).max(5000).parse(req.body.text);
    const noteId = z.string().uuid().parse(req.get("Idempotency-Key"));
    await db.transaction(async (q) => {
      const lead = await q("SELECT id FROM leads WHERE id=$1 FOR UPDATE", [id]);
      if (!lead.rows.length)
        throw new DomainError(404, "NOT_FOUND", "Enquiry not found.");
      await q(
        "INSERT INTO lead_notes(id,lead_id,text,actor) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
        [noteId, id, text, "local-owner"],
      );
      const stored = (
        await q<{ lead_id: string; text: string }>(
          "SELECT lead_id,text FROM lead_notes WHERE id=$1",
          [noteId],
        )
      ).rows[0];
      if (stored.lead_id !== id || stored.text !== text)
        throw new DomainError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "This note key was already used for a different note. Refresh before creating another note.",
        );
    });
    data(res, { saved: true });
  });
  app.get("/api/v1/admin/notifications/failures", async (_req, res) =>
    data(
      res,
      (
        await db.query(
          "SELECT j.id,l.reference,j.status,j.safe_error_code,j.created_at FROM notification_jobs j JOIN leads l ON l.id=j.lead_id ORDER BY j.created_at DESC LIMIT 50",
        )
      ).rows,
    ),
  );
  app.post("/api/v1/admin/notifications/:id/retry", (_req, _res) => {
    throw new DomainError(
      503,
      "MAIL_NOT_CONFIGURED",
      "No mail provider is connected. Your enquiry remains stored.",
    );
  });
  app.get("/api/v1/admin/audit", async (_req, res) =>
    data(
      res,
      (
        await db.query(
          "SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 50",
        )
      ).rows,
    ),
  );
  registerSiteImages(app, db);
  app.use("/api/v1", (_req, _res, next) =>
    next(new DomainError(404, "NOT_FOUND", "Endpoint not found.")),
  );
  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const parseType = (error as { type?: string } | null)?.type;
      if (
        parseType === "entity.too.large" ||
        parseType === "entity.parse.failed"
      ) {
        return res.status(parseType === "entity.too.large" ? 413 : 400).json({
          error: {
            code:
              parseType === "entity.too.large"
                ? "PAYLOAD_TOO_LARGE"
                : "INVALID_JSON",
            message: req.path.startsWith("/api/v1/admin/site-images/")
              ? "Choose a photo under 5 MB and send valid image details."
              : "Send a valid JSON request within the 32 KB limit.",
            fields: {},
            requestId: res.locals.requestId,
          },
        });
      }
      if (error instanceof z.ZodError) {
        const fields = Object.fromEntries(
          error.issues.map((i) => [i.path.join("."), i.message]),
        );
        return res.status(422).json({
          error: {
            code: "VALIDATION_FAILED",
            message: "Check the highlighted fields.",
            fields,
            requestId: res.locals.requestId,
          },
        });
      }
      const e =
        error instanceof DomainError
          ? error
          : new DomainError(
              500,
              "INTERNAL_ERROR",
              "Unable to complete this request. Retry with the same submission.",
            );
      return res.status(e.status).json({
        error: {
          code: e.code,
          message: e.message,
          fields: {},
          requestId: res.locals.requestId,
        },
      });
    },
  );
  return app;
}
