import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = process.argv[2];
const files = process.argv.slice(3).filter((file) => existsSync(file));

if (!pkg || files.length === 0) {
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = path.join(root, pkg);
const relativeFiles = files.map((file) => {
  const normalized = file.replace(/\\/g, "/");
  const marker = `/${pkg}/`;
  const markerIdx = normalized.indexOf(marker);
  if (markerIdx >= 0) {
    return normalized.slice(markerIdx + marker.length);
  }
  const prefix = `${pkg}/`;
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length);
  }
  return normalized;
});

const result = spawnSync("npx", ["eslint", "--fix", ...relativeFiles], {
  cwd: pkgDir,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
