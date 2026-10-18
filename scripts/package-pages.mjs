import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const webRoot = path.resolve(import.meta.dirname, "../apps/web");
const clientRoot = path.join(webRoot, "build/client");
const prerenderedRoot = path.join(clientRoot, "NEXTGEN-TECH-WEBSITE");
const pagesRoot = path.join(webRoot, "build/pages");

await rm(pagesRoot, { recursive: true, force: true });
await mkdir(pagesRoot, { recursive: true });

await cp(prerenderedRoot, pagesRoot, { recursive: true });

for (const directory of ["assets", "fonts", "images"]) {
  await cp(
    path.join(clientRoot, directory),
    path.join(pagesRoot, directory),
    { recursive: true },
  );
}

for (const file of ["favicon.svg", "robots.txt"]) {
  await copyFile(path.join(clientRoot, file), path.join(pagesRoot, file));
}

await copyFile(
  path.join(prerenderedRoot, "404/index.html"),
  path.join(pagesRoot, "404.html"),
);

console.log(`Prepared ${pagesRoot}`);
