import express from "express";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { openDatabase } from "./db";
import { createApp } from "./app";

const local = process.env.APP_ENV !== "production";
if (!local)
  throw new Error(
    "Public release blocked: configure and verify staff OIDC/MFA, mail delivery, approved content/privacy and production migrations first. See README.md.",
  );
const staticMode = process.argv.includes("--static");
const port = Number(process.env.PORT ?? (staticMode ? 5174 : 4102));
const db = await openDatabase(process.env.DATABASE_URL || undefined);
const app = createApp(db, {
  local,
  secret: process.env.SESSION_SECRET ?? randomBytes(32).toString("hex"),
  origin: process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:5174",
});
if (staticMode) {
  const dir = fileURLToPath(
    new URL("../../web/build/client/", import.meta.url),
  );
  if (!existsSync(dir))
    throw Error("Build the website before starting the static preview.");
  app.use(express.static(dir, { index: false }));
  app.use((req, res) => {
    if (req.method !== "GET") return res.sendStatus(405);
    const routePath =
      req.path === "/" ? "index" : req.path.replace(/^\/|\/$/g, "");
    const candidate = resolve(dir, `${routePath}.html`);
    const nested = resolve(dir, routePath, "index.html");
    if (
      !candidate.startsWith(resolve(dir) + "\\") &&
      !candidate.startsWith(resolve(dir) + "/")
    )
      return res.sendStatus(404);
    if (existsSync(candidate)) return res.sendFile(candidate);
    if (existsSync(nested)) return res.sendFile(nested);
    if (req.path === "/admin" || req.path.startsWith("/admin/"))
      return res.sendFile(resolve(dir, "__spa-fallback.html"));
    const errorPage = existsSync(resolve(dir, "404.html"))
      ? resolve(dir, "404.html")
      : resolve(dir, "404/index.html");
    return res.status(404).sendFile(errorPage);
  });
}
const server = app.listen(port, "127.0.0.1", () =>
  console.log(
    `Nextgen ${staticMode ? "website" : "API"}: http://127.0.0.1:${port} (local development only)`,
  ),
);
const close = () =>
  server.close(() => {
    void db.close().then(() => process.exit(0));
  });
process.on("SIGINT", close);
process.on("SIGTERM", close);
