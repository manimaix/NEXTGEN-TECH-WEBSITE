import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { openDatabase, type Database } from "../apps/api/src/db";
import { createApp } from "../apps/api/src/app";
import { enquirySchema, edges } from "../packages/contracts/src/index";
let db: Database,
  server: Server,
  base: string,
  scopeCookie: string,
  token: string,
  staffCookie: string,
  csrf: string,
  leadId: string;
const origin = "http://127.0.0.1:5174";
const input = () => ({
  name: "Synthetic Tester",
  email: "tester@example.test",
  service: "consulting",
  message: "Synthetic test enquiry about improving an internal workflow.",
  privacyAcknowledged: true,
  privacyNoticeVersion: "development-v1",
  marketingConsent: false,
  submissionToken: token,
});
async function post(
  path: string,
  payload: unknown,
  key = randomUUID(),
  cookie = scopeCookie,
) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
      cookie,
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: JSON.stringify(payload),
  });
}
before(async () => {
  db = await openDatabase("memory://");
  server = createApp(db, {
    origin,
    secret: "test-only-secret-never-use-in-production",
    local: true,
  }).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  base = `http://127.0.0.1:${address.port}/api/v1`;
  const response = await fetch(`${base}/enquiry-session`);
  scopeCookie = response.headers.getSetCookie()[0].split(";")[0];
  token = (await response.json()).data.submissionToken;
});
after(async () => {
  if (server) await new Promise<void>((r) => server.close(() => r()));
  await db?.close();
});
test("contract rejects hidden privileged fields and incompatible conditional details", () => {
  assert.equal(
    enquirySchema.safeParse({ ...input(), owner: "attacker" }).success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({ ...input(), training: { teamSize: "1_5" } })
      .success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({ ...input(), marketingConsent: false }).success,
    true,
  );
});
test("a visitor cannot read private enquiries", async () => {
  assert.equal((await fetch(`${base}/admin/leads`)).status, 401);
});
test("origin and token checks reject invalid requests", async () => {
  assert.equal(
    (
      await fetch(`${base}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input()),
      })
    ).status,
    403,
  );
  assert.equal(
    (await post("/enquiries", { ...input(), submissionToken: "invalid" }))
      .status,
    403,
  );
});
test("field errors do not create leads", async () => {
  const r = await post("/enquiries", { ...input(), message: "short" });
  assert.equal(r.status, 422);
  const body = await r.json();
  assert.ok(body.error.fields.message);
  assert.equal((await db.query("SELECT id FROM leads")).rows.length, 0);
});
test("concurrent duplicate requests commit one lead, consent pair and notification intention", async () => {
  const key = randomUUID();
  const responses = await Promise.all([
    post("/enquiries", input(), key),
    post("/enquiries", input(), key),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 201]);
  const [a, b] = await Promise.all(responses.map((r) => r.json()));
  assert.equal(a.data.reference, b.data.reference);
  const leads = (await db.query<{ id: string }>("SELECT id FROM leads")).rows;
  assert.equal(leads.length, 1);
  leadId = leads[0].id;
  assert.equal((await db.query("SELECT id FROM lead_consents")).rows.length, 2);
  assert.equal(
    (await db.query("SELECT id FROM notification_jobs")).rows.length,
    1,
  );
  const conflict = await post(
    "/enquiries",
    { ...input(), name: "Different tester" },
    key,
  );
  assert.equal(conflict.status, 409);
});
test("matching replay survives a submission token refresh", async () => {
  const key = randomUUID();
  const first = await (await post("/enquiries", input(), key)).json();
  const refreshed = await (
    await fetch(`${base}/enquiry-session`, { headers: { cookie: scopeCookie } })
  ).json();
  const repeat = await (
    await post(
      "/enquiries",
      { ...input(), submissionToken: refreshed.data.submissionToken },
      key,
    )
  ).json();
  assert.equal(repeat.data.reference, first.data.reference);
  assert.equal(repeat.meta.replayed, true);
});
test("email unavailability remains explicit while the enquiry is durable", async () => {
  const jobs = (
    await db.query<{ status: string; safe_error_code: string }>(
      "SELECT status,safe_error_code FROM notification_jobs",
    )
  ).rows;
  assert.ok(jobs.length > 0);
  assert.equal(jobs[0].status, "failed");
  assert.equal(jobs[0].safe_error_code, "MAIL_NOT_CONFIGURED");
});
test("local staff access checks CSRF and exposes actual stored details", async () => {
  const login = await post("/auth/local", {});
  assert.equal(login.status, 200);
  staffCookie = login.headers.getSetCookie()[0].split(";")[0];
  csrf = (await login.json()).data.csrf;
  const r = await fetch(`${base}/admin/leads/${leadId}`, {
    headers: { cookie: staffCookie },
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).data.email, "tester@example.test");
  const denied = await fetch(`${base}/admin/leads/${leadId}`, {
    method: "PATCH",
    headers: {
      origin,
      cookie: staffCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expectedVersion: 1,
      status: "triaged",
      reason: "Test triage",
    }),
  });
  assert.equal(denied.status, 403);
});
test("version guards and legal stage edges prevent conflicting staff updates", async () => {
  const update = async (version: number, status: string) =>
    fetch(`${base}/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: {
        origin,
        cookie: staffCookie,
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      body: JSON.stringify({
        expectedVersion: version,
        status,
        reason: "Synthetic test update",
      }),
    });
  assert.equal((await update(1, "triaged")).status, 200);
  assert.equal((await update(1, "contacted")).status, 409);
  assert.equal((await update(2, "won")).status, 409);
  assert.equal(
    (await db.query("SELECT id FROM lead_events WHERE lead_id=$1", [leadId]))
      .rows.length,
    2,
  );
  assert.ok(!edges.new.includes("won"));
});
test("notes are plain text and repeat note intent is idempotent", async () => {
  const key = randomUUID();
  assert.equal(
    (
      await post(
        `/admin/leads/${leadId}/notes`,
        { text: "Synthetic internal note" },
        key,
        staffCookie,
      )
    ).status,
    200,
  );
  await post(
    `/admin/leads/${leadId}/notes`,
    { text: "Synthetic internal note" },
    key,
    staffCookie,
  );
  assert.equal(
    (await db.query("SELECT id FROM lead_notes WHERE lead_id=$1", [leadId]))
      .rows.length,
    1,
  );
});
test("database transaction rolls back on failure", async () => {
  await assert.rejects(
    db.transaction(async (q) => {
      await q("INSERT INTO audit_events(id,action,actor) VALUES($1,$2,$3)", [
        randomUUID(),
        "should-roll-back",
        "test",
      ]);
      throw Error("Synthetic failure");
    }),
  );
  assert.equal(
    (
      await db.query("SELECT id FROM audit_events WHERE action=$1", [
        "should-roll-back",
      ])
    ).rows.length,
    0,
  );
});
test("note retries reject changed text and missing leads", async () => {
  const key = randomUUID();
  assert.equal(
    (
      await post(
        `/admin/leads/${leadId}/notes`,
        { text: "Original" },
        key,
        staffCookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await post(
        `/admin/leads/${leadId}/notes`,
        { text: "Changed" },
        key,
        staffCookie,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await post(
        `/admin/leads/${randomUUID()}/notes`,
        { text: "Missing lead" },
        randomUUID(),
        staffCookie,
      )
    ).status,
    404,
  );
});
test("malformed and oversized JSON return safe client errors", async () => {
  const send = (body: string) =>
    fetch(`${base}/enquiries`, {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body,
    });
  assert.equal((await send("{")).status, 400);
  assert.equal(
    (await send(JSON.stringify({ message: "x".repeat(40000) }))).status,
    413,
  );
});
