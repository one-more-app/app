#!/usr/bin/env node
/**
 * Audit de couverture des rangs sur le catalogue exercices.
 * Échoue (exit 1) si un exercice fixable n'a pas de ladder de rang.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyExerciseRankCoverage } from "../dist/shared/strength-standards.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const catalogPath = join(dataDir, "popular-exercises.json");

function analyzeCatalog(catalogPath) {
  const exercises = JSON.parse(readFileSync(catalogPath, "utf8"));
  const stats = { ok: 0, intentional: 0, gap: 0 };
  const gaps = [];

  for (const ex of exercises) {
    const status = classifyExerciseRankCoverage(ex.name, {
      equipment: ex.equipment,
      target: ex.target,
      bodyPart: ex.bodyPart,
    });
    stats[status]++;
    if (status === "gap") {
      gaps.push(ex);
    }
  }

  return { total: exercises.length, stats, gaps };
}

const { total, stats, gaps } = analyzeCatalog(catalogPath);
const fixable = stats.ok + stats.gap;
const pct = fixable > 0 ? ((stats.ok / fixable) * 100).toFixed(1) : "100.0";

console.log("\n=== popular-exercises.json ===");
console.log(`Total: ${total}`);
console.log(`  ok:           ${stats.ok}`);
console.log(`  intentional:  ${stats.intentional}`);
console.log(`  gap:          ${stats.gap}`);
console.log(`Couverture fixable: ${stats.ok}/${fixable} (${pct}%)`);

if (gaps.length > 0) {
  console.error("\nExercices sans rang (gap):");
  for (const ex of gaps) {
    console.error(`  - [${ex.equipment} / ${ex.target}] ${ex.name} (${ex.id})`);
  }
  console.error("\nÉchec : des exercices fixables n'ont pas de rang.");
  process.exit(1);
}

console.log("\nCouverture rangs OK (0 gap fixable).");
