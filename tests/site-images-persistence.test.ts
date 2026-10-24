import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import sharp from "sharp";
import { createApp } from "../apps/api/src/app";
import { openDatabase, type Database } from "../apps/api/src/db";
import {
  defaultImage,
  imageSlots,
  maxImageBytes,
  type SiteImage,
} from "../packages/contracts/src/site-images";

test("large uploads, metadata, versions, audit and resets survive disk database reopen", async () => {
  const temporaryRoot = await realpath(tmpdir());
  const directory = await mkdtemp(join(temporaryRoot, "nextgen-site-images-"));
  const databasePath = join(directory, "postgres");
  const origin = "http://127.0.0.1:5174";
  const slot = "team-1";
  const details = {
    alt: "Synthetic disk persistence photo",
    caption: "Persistence test only",
    name: "Synthetic Person",
    role: "Test fixture",
    focalX: 35,
    focalY: 65,
    isPlaceholder: false,
  };
  let database: Database | undefined;
  let server: Server | undefined;
  let base = "";
  let cookie = "";
  let csrf = "";

  const start = async () => {
    // Never use the application's default .data/postgres directory.
    database = await openDatabase(databasePath);
    server = createApp(database, {
      origin,
      secret: "isolated-image-persistence-test-only",
      local: true,
    }).listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    base = `http://127.0.0.1:${address.port}`;
    const login = await fetch(`${base}/api/v1/auth/local`, {
      method: "POST",
      headers: { origin },
    });
    assert.equal(login.status, 200);
    cookie = login.headers.getSetCookie()[0].split(";")[0];
    csrf = (await login.json()).data.csrf;
  };
  const stop = async () => {
    if (server) {
      await new Promise<void>((resolve, reject) =>
        server!.close((error) => (error ? reject(error) : resolve())),
      );
      server = undefined;
    }
    if (database) {
      await database.close();
      database = undefined;
    }
  };
  const write = (body: unknown, method = "PUT") =>
    fetch(`${base}/api/v1/admin/site-images/${slot}`, {
      method,
      headers: {
        origin,
        cookie,
        "X-CSRF-Token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  const readImage = async () => {
    const response = await fetch(`${base}/api/v1/site-images`);
    assert.equal(response.status, 200);
    const images: SiteImage[] = (await response.json()).data;
    assert.equal(images.length, imageSlots.length);
    assert.deepEqual(
      images.find((image) => image.slot === "team-2"),
      defaultImage("team-2"),
    );
    const image = images.find((item) => item.slot === slot);
    assert.ok(image);
    return image;
  };
  const readBytes = async (image: SiteImage) => {
    const response = await fetch(base + image.src);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/webp");
    return Buffer.from(await response.arrayBuffer());
  };
  const auditActions = async () =>
    (
      await database!.query<{ action: string }>(
        "SELECT action FROM audit_events WHERE object_id=$1 ORDER BY created_at,id",
        [slot],
      )
    ).rows.map((row) => row.action);

  try {
    await start();
    // Disabling PNG compression creates a real image larger than 4 MB.
    const photo = await sharp({
      create: { width: 1400, height: 1000, channels: 3, background: "#006647" },
    })
      .png({ compressionLevel: 0 })
      .toBuffer();
    assert.ok(photo.length > 4 * 1024 * 1024 && photo.length <= maxImageBytes);
    const upload = await write({
      ...details,
      expectedVersion: 0,
      image: { type: "image/png", base64: photo.toString("base64") },
    });
    assert.equal(upload.status, 200);
    const saved: SiteImage = (await upload.json()).data;
    assert.equal(saved.version, 1);
    assert.equal(saved.uploaded, true);
    assert.equal(saved.isPlaceholder, false);
    assert.equal(saved.width, 1400);
    assert.equal(saved.height, 1000);
    const bytes = await readBytes(saved);
    assert.equal((await sharp(bytes).metadata()).format, "webp");

    await stop();
    await start();
    assert.deepEqual(await readImage(), saved);
    assert.deepEqual(await readBytes(saved), bytes);
    assert.deepEqual(await auditActions(), ["site_image_updated"]);
    assert.equal(
      (await write({ ...details, expectedVersion: 0 })).status,
      409,
    );

    const edit = await write({
      ...details,
      caption: "Edited after reopening",
      expectedVersion: 1,
    });
    assert.equal(edit.status, 200);
    const edited: SiteImage = (await edit.json()).data;
    assert.equal(edited.version, 2);
    assert.equal(edited.caption, "Edited after reopening");
    assert.deepEqual(await readBytes(edited), bytes);

    await stop();
    await start();
    assert.deepEqual(await readImage(), edited);
    assert.deepEqual(await readBytes(edited), bytes);
    const reset = await write({ expectedVersion: 2 }, "DELETE");
    assert.equal(reset.status, 200);
    const restored: SiteImage = (await reset.json()).data;
    assert.deepEqual(restored, {
      ...defaultImage(slot),
      version: 3,
      updatedAt: restored.updatedAt,
    });

    await stop();
    await start();
    assert.deepEqual(await readImage(), restored);
    assert.equal(
      (await fetch(`${base}/api/v1/site-images/${slot}/file`)).status,
      404,
    );
    assert.equal(
      (await write({ ...details, expectedVersion: 2 })).status,
      409,
    );
    assert.deepEqual(await auditActions(), [
      "site_image_updated",
      "site_image_updated",
      "site_image_reset",
    ]);
  } finally {
    await stop();
    // Delete only the exact, freshly created directory inside the OS temp root.
    assert.equal(await realpath(directory), directory);
    assert.equal(dirname(directory), temporaryRoot);
    assert.ok(basename(directory).startsWith("nextgen-site-images-"));
    await rm(directory, { recursive: true, force: true });
  }
});
