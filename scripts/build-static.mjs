import { cp, mkdir, rm, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist");

const skipNames = new Set([
  ".git",
  ".github",
  "dist",
  "node_modules",
  "applications",
  "scripts",
]);

async function copyEntry(name) {
  if (skipNames.has(name) || name.startsWith(".")) return;
  const from = path.join(root, name);
  const to = path.join(outDir, name);
  const info = await stat(from);
  if (info.isDirectory()) {
    await cp(from, to, { recursive: true });
    return;
  }
  await cp(from, to);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const entries = await readdir(root);
await Promise.all(entries.map(copyEntry));

console.log(`Static site built to ${path.relative(root, outDir)}/`);
