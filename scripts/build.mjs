import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const p = require.resolve("@react-router/dev/package.json"),
  j = require(p);
const bin = path.resolve(
  path.dirname(p),
  typeof j.bin === "string" ? j.bin : Object.values(j.bin)[0],
);
const result = spawnSync(process.execPath, [bin, "build"], {
  cwd: path.resolve(import.meta.dirname, "../apps/web"),
  stdio: "inherit",
});
process.exit(result.status ?? 1);
