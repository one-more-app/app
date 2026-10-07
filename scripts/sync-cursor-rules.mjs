#!/usr/bin/env node
/**
 * Copie .cursor/rules/*.mdc → docs/cursor-rules/*.md pour VitePress.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, '.cursor', 'rules');
const destDir = path.join(root, 'docs', 'cursor-rules');

if (!fs.existsSync(srcDir)) {
  console.warn('[sync-cursor-rules] missing', srcDir);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });

const keep = new Set(['README.md']);
for (const name of fs.readdirSync(destDir)) {
  if (name.endsWith('.md') && !keep.has(name)) {
    fs.unlinkSync(path.join(destDir, name));
  }
}

let count = 0;
for (const name of fs.readdirSync(srcDir)) {
  if (!name.endsWith('.mdc')) continue;
  const slug = name.replace(/\.mdc$/, '');
  fs.writeFileSync(
    path.join(destDir, `${slug}.md`),
    fs.readFileSync(path.join(srcDir, name), 'utf8'),
  );
  count += 1;
}

console.log(`[sync-cursor-rules] ${count} rule(s) → docs/cursor-rules/`);
