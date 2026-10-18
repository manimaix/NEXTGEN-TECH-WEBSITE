import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url),
  root = path.resolve(import.meta.dirname, "..");
const cli = (pkg) => {
  const p = require.resolve(`${pkg}/package.json`);
  const json = require(p);
  return path.resolve(
    path.dirname(p),
    typeof json.bin === "string" ? json.bin : Object.values(json.bin)[0],
  );
};
const children = [
  spawn(process.execPath, [cli("tsx"), "apps/api/src/server.ts"], {
    cwd: root,
    stdio: "inherit",
  }),
  spawn(process.execPath, [cli("@react-router/dev"), "dev"], {
    cwd: path.join(root, "apps/web"),
    stdio: "inherit",
  }),
];
let ending = false;
function stop(code = 0) {
  if (ending) return;
  ending = true;
  for (const c of children) c.kill();
  setTimeout(() => process.exit(code), 250);
}
for (const c of children) c.on("exit", (code) => stop(code ?? 0));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
