import express from "express";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  defaultImage,
  imageSlots,
  imageSlotSchema,
  imageUpdateSchema,
  maxImageBytes,
  type ImageDetails,
  type ImageSlotId,
  type SiteImage,
} from "../../../packages/contracts/src/site-images";
import type { Database } from "./db";
import { DomainError } from "./leads";

type ImageRow = {
  slot: ImageSlotId;
  version: number;
  details: Partial<ImageDetails>;
  image_base64: string | null;
  width: number;
  height: number;
  updated_at: string | Date;
};
const metadataColumns =
  "slot,version,details,width,height,updated_at,(image_base64 IS NOT NULL) AS uploaded";
function present(
  row: Omit<ImageRow, "image_base64"> & { uploaded: boolean },
): SiteImage {
  const base = defaultImage(row.slot);
  return {
    ...base,
    ...row.details,
    slot: row.slot,
    version: row.version,
    uploaded: row.uploaded,
    src: row.uploaded
      ? `/api/v1/site-images/${row.slot}/file?v=${row.version}`
      : base.src,
    width: row.width || base.width,
    height: row.height || base.height,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
const respond = (res: express.Response, value: unknown) =>
  res.json({ data: value, meta: { requestId: res.locals.requestId } });

// Register public reads before the API 404. The admin prefix is protected in app.ts.
export function registerSiteImages(app: express.Express, db: Database) {
  const list = async (_req: express.Request, res: express.Response) => {
    const rows = (
      await db.query<Omit<ImageRow, "image_base64"> & { uploaded: boolean }>(
        `SELECT ${metadataColumns} FROM site_images`,
      )
    ).rows;
    respond(
      res,
      imageSlots.map((slot) => {
        const row = rows.find((item) => item.slot === slot.id);
        return row ? present(row) : defaultImage(slot.id);
      }),
    );
  };
  app.get("/api/v1/site-images", list);
  app.get("/api/v1/admin/site-images", list);
  app.get("/api/v1/site-images/:slot/file", async (req, res) => {
    const slot = imageSlotSchema.parse(req.params.slot);
    const row = (
      await db.query<{ image_base64: string | null }>(
        "SELECT image_base64 FROM site_images WHERE slot=$1",
        [slot],
      )
    ).rows[0];
    if (!row?.image_base64)
      throw new DomainError(
        404,
        "IMAGE_NOT_FOUND",
        "No uploaded image in this placement.",
      );
    res.set("Content-Type", "image/webp");
    res.set("Content-Disposition", `inline; filename="${slot}.webp"`);
    res.send(Buffer.from(row.image_base64, "base64"));
  });

  let processing = 0;
  const buckets = new Map<string, { count: number; until: number }>();
  const limitWrites: express.RequestHandler = (req, _res, next) => {
    const key = String(req.cookies.ng_staff),
      now = Date.now();
    for (const [id, value] of buckets)
      if (value.until < now) buckets.delete(id);
    const bucket = buckets.get(key) ?? { count: 0, until: now + 60000 };
    bucket.count++;
    buckets.set(key, bucket);
    if (bucket.count > 20)
      return next(
        new DomainError(
          429,
          "IMAGE_RATE_LIMIT",
          "Too many image updates. Wait a minute and try again.",
        ),
      );
    next();
  };
  const largeJson = express.json({ limit: "7mb" });
  app.put(
    "/api/v1/admin/site-images/:slot",
    limitWrites,
    largeJson,
    async (req, res) => {
      const slot = imageSlotSchema.parse(req.params.slot);
      const { expectedVersion, image, ...details } = imageUpdateSchema.parse(
        req.body,
      );
      let encoded:
        { base64: string; width: number; height: number } | undefined;
      if (image) {
        if (processing >= 2)
          throw new DomainError(
            503,
            "IMAGE_BUSY",
            "Other images are processing. Try again in a moment.",
          );
        processing++;
        try {
          const bytes = Buffer.from(image.base64, "base64");
          if (!bytes.length || bytes.length > maxImageBytes)
            throw Error("size");
          const pipeline = sharp(bytes, {
            limitInputPixels: 25000000,
            failOn: "warning",
          }).timeout({ seconds: 10 });
          const metadata = await pipeline.metadata();
          const allowed = {
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
          };
          if (
            !metadata.format ||
            !(metadata.format in allowed) ||
            allowed[metadata.format as keyof typeof allowed] !== image.type ||
            (metadata.pages ?? 1) > 1
          )
            throw Error("format");
          const { data, info } = await pipeline
            .rotate()
            .resize({
              width: 2400,
              height: 2400,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 84 })
            .toBuffer({ resolveWithObject: true });
          encoded = {
            base64: data.toString("base64"),
            width: info.width,
            height: info.height,
          };
        } catch {
          throw new DomainError(
            422,
            "INVALID_IMAGE",
            "Choose a valid, non-animated JPG, PNG or WebP under 5 MB and 25 megapixels.",
          );
        } finally {
          processing--;
        }
      }
      const saved = await db.transaction(async (q) => {
        await q(
          "INSERT INTO site_images(slot) VALUES($1) ON CONFLICT(slot) DO NOTHING",
          [slot],
        );
        const current = (
          await q<ImageRow>(
            "SELECT * FROM site_images WHERE slot=$1 FOR UPDATE",
            [slot],
          )
        ).rows[0];
        if (current.version !== expectedVersion)
          throw new DomainError(
            409,
            "IMAGE_CONFLICT",
            "This image changed in another session. Reload this placement before saving.",
          );
        if (!encoded && !current.image_base64 && !details.isPlaceholder)
          throw new DomainError(
            422,
            "PLACEHOLDER_REQUIRED",
            "Upload your own photo before removing the placeholder label.",
          );
        await q(
          "UPDATE site_images SET version=version+1,details=$2,image_base64=$3,width=$4,height=$5,updated_at=now() WHERE slot=$1",
          [
            slot,
            JSON.stringify(details),
            encoded?.base64 ?? current.image_base64,
            encoded?.width ?? current.width,
            encoded?.height ?? current.height,
          ],
        );
        await q(
          "INSERT INTO audit_events(id,action,object_id,actor) VALUES($1,$2,$3,$4)",
          [randomUUID(), "site_image_updated", slot, "local-owner"],
        );
        return present(
          (
            await q<Omit<ImageRow, "image_base64"> & { uploaded: boolean }>(
              `SELECT ${metadataColumns} FROM site_images WHERE slot=$1`,
              [slot],
            )
          ).rows[0],
        );
      });
      respond(res, saved);
    },
  );
  app.delete(
    "/api/v1/admin/site-images/:slot",
    limitWrites,
    express.json({ limit: "1kb" }),
    async (req, res) => {
      const slot = imageSlotSchema.parse(req.params.slot);
      const { expectedVersion } = z
        .object({ expectedVersion: z.number().int().min(0) })
        .strict()
        .parse(req.body);
      const saved = await db.transaction(async (q) => {
        await q(
          "INSERT INTO site_images(slot) VALUES($1) ON CONFLICT(slot) DO NOTHING",
          [slot],
        );
        const current = (
          await q<ImageRow>(
            "SELECT * FROM site_images WHERE slot=$1 FOR UPDATE",
            [slot],
          )
        ).rows[0];
        if (current.version !== expectedVersion)
          throw new DomainError(
            409,
            "IMAGE_CONFLICT",
            "This image changed in another session. Reload this placement before resetting.",
          );
        await q(
          "UPDATE site_images SET version=version+1,details='{}',image_base64=NULL,width=0,height=0,updated_at=now() WHERE slot=$1",
          [slot],
        );
        await q(
          "INSERT INTO audit_events(id,action,object_id,actor) VALUES($1,$2,$3,$4)",
          [randomUUID(), "site_image_reset", slot, "local-owner"],
        );
        return present(
          (
            await q<Omit<ImageRow, "image_base64"> & { uploaded: boolean }>(
              `SELECT ${metadataColumns} FROM site_images WHERE slot=$1`,
              [slot],
            )
          ).rows[0],
        );
      });
      respond(res, saved);
    },
  );
}
