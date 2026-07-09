import { existsSync } from "node:fs";

const BATCH_SIZE = 25;

/** @param {string} pkg @param {string[]} files */
function eslintInPackage(pkg, files) {
  const existing = files.filter((file) => existsSync(file));
  if (existing.length === 0) return [];

  const commands = [];
  for (let i = 0; i < existing.length; i += BATCH_SIZE) {
    const chunk = existing.slice(i, i + BATCH_SIZE).join(" ");
    commands.push(`node scripts/eslint-package.mjs ${pkg} ${chunk}`);
  }
  return commands;
}

export default {
  "client/**/*.{ts,tsx}": (files) => eslintInPackage("client", files),
  "api/**/*.ts": (files) => eslintInPackage("api", files),
};
