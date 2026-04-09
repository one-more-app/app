import { inferBodyPartFromTarget } from "@/lib/infer-body-part-from-target";

/** Sélection par groupe : tout le groupe ou sous-ensemble de muscles `target` */
export type MuscleSelection = Record<string, "all" | string[]>;

/** Ordre d’affichage des groupes (clés `bodyPart` ExerciseDB) */
export const MUSCLE_GROUP_ORDER: string[] = [
  "chest",
  "back",
  "shoulders",
  "upper arms",
  "lower arms",
  "waist",
  "upper legs",
  "lower legs",
  "neck",
];

export function buildTargetsByBodyPart(availableTargets: string[]): Record<string, string[]> {
  const byGroup: Record<string, string[]> = {};
  for (const t of availableTargets) {
    const g = inferBodyPartFromTarget(t);
    if (!g) continue;
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(t);
  }
  for (const k of Object.keys(byGroup)) {
    byGroup[k]!.sort((a, b) => a.localeCompare(b));
  }
  return byGroup;
}

export function orderedMuscleGroups(byGroup: Record<string, string[]>): string[] {
  const keys = new Set(Object.keys(byGroup));
  const ordered = MUSCLE_GROUP_ORDER.filter((g) => keys.has(g));
  const rest = [...keys].filter((g) => !MUSCLE_GROUP_ORDER.includes(g)).sort();
  return [...ordered, ...rest];
}

export function isMuscleSelectionEmpty(sel: MuscleSelection): boolean {
  return Object.keys(sel).length === 0;
}

export function exerciseMatchesMuscleSelection(
  ex: { bodyPart?: string; target?: string },
  selection: MuscleSelection,
): boolean {
  if (isMuscleSelectionEmpty(selection)) return true;

  const target = (ex.target ?? "").toLowerCase();
  const bp = (ex.bodyPart ?? "").toLowerCase();
  const inferred = target ? inferBodyPartFromTarget(target) : undefined;

  for (const group of Object.keys(selection)) {
    const g = group.toLowerCase();
    const sel = selection[group];
    if (sel === "all") {
      if (bp === g || inferred === g) return true;
      // Sélection plate : la clé est un `target` ExerciseDB
      if (target === g) return true;
    } else if (Array.isArray(sel) && sel.length > 0) {
      const set = new Set(sel.map((t) => t.toLowerCase()));
      if (set.has(target)) return true;
    }
  }
  return false;
}

/** `group::*` ou `group::t1,t2` ; groupes séparés par `;;` */
export function serializeMuscleSelection(sel: MuscleSelection): string {
  const entries = Object.entries(sel)
    .filter(([, v]) => v === "all" || (Array.isArray(v) && v.length > 0))
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return "";
  return entries
    .map(([g, v]) => `${g}::${v === "all" ? "*" : (v as string[]).join(",")}`)
    .join(";;");
}

export function parseMuscleSelection(raw: string | null): MuscleSelection {
  if (!raw?.trim()) return {};
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return {};
  }
  const out: MuscleSelection = {};
  for (const block of decoded.split(";;")) {
    const idx = block.indexOf("::");
    if (idx <= 0) continue;
    const group = block.slice(0, idx).trim().toLowerCase();
    const spec = block.slice(idx + 2).trim();
    if (!group) continue;
    if (spec === "*") {
      out[group] = "all";
    } else if (spec) {
      const targets = spec
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (targets.length > 0) out[group] = targets;
    }
  }
  return out;
}

export function sanitizeMuscleSelection(
  sel: MuscleSelection,
  availableTargets: string[],
): MuscleSelection {
  const tree = buildTargetsByBodyPart(availableTargets);
  const allowedTarget = new Set(availableTargets.map((t) => t.toLowerCase()));
  const next: MuscleSelection = {};
  for (const [g, v] of Object.entries(sel)) {
    const gl = g.toLowerCase();
    const groupTargets = tree[gl];
    if (groupTargets?.length) {
      if (v === "all") {
        next[gl] = "all";
      } else if (Array.isArray(v)) {
        const filtered = v.filter((t) =>
          groupTargets.includes(t.toLowerCase()),
        );
        if (filtered.length === groupTargets.length) {
          next[gl] = "all";
        } else if (filtered.length > 0) {
          next[gl] = filtered;
        }
      }
      continue;
    }
    if (allowedTarget.has(gl)) {
      if (v === "all") {
        next[gl] = "all";
      } else if (Array.isArray(v)) {
        const filtered = v.filter((t) => t.toLowerCase() === gl);
        if (filtered.length > 0) next[gl] = "all";
      }
    }
  }
  return next;
}

export function muscleSelectionSummary(
  sel: MuscleSelection,
  byGroup: Record<string, string[]>,
): { kind: "none" } | { kind: "count"; n: number } {
  if (isMuscleSelectionEmpty(sel)) return { kind: "none" };
  let n = 0;
  for (const [g, v] of Object.entries(sel)) {
    if (!byGroup[g]) continue;
    if (v === "all") n += byGroup[g]!.length;
    else if (Array.isArray(v)) n += v.length;
  }
  return { kind: "count", n };
}
