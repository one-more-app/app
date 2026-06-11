import { CARDIO_EQUIPMENT, sortExercisesByPopularity } from "@/lib/exercisedb";
import { translateSearchQueryToEnglish } from "@/lib/exercise-translations";
import { inferBodyPartFromTarget } from "@/lib/infer-body-part-from-target";
import {
  buildTargetsByBodyPart,
  orderedMuscleGroups,
  type MuscleSelection,
} from "@/lib/muscle-filter";
import type { ExerciseDBExercise, TrackedExercise } from "@/types";

export type CatalogBrowseStep = "zone" | "muscle" | "equipment" | "list";

/** Clé interne pour les exercices sans matériel renseigné (ex. personnalisés anciens). */
export const UNSPECIFIED_EQUIPMENT = "__unspecified__";

export type CatalogBrowseParams = {
  step: CatalogBrowseStep;
  zone: string | null;
  target: string | null;
  beq: string | null;
};

/** Exercice minimal pour le parcours imbriqué (catalogue ou suivis). */
export type BrowseableExercise = {
  id: string;
  name: string;
  originalName?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  gifUrl?: string;
};

export function trackedToBrowseable(ex: TrackedExercise): BrowseableExercise {
  return {
    id: ex.id,
    name: ex.name,
    originalName: ex.originalName,
    bodyPart: ex.bodyPart,
    target: ex.target,
    equipment: ex.equipment,
    gifUrl: ex.gifUrl,
  };
}

export function catalogToBrowseable(ex: ExerciseDBExercise): BrowseableExercise {
  return {
    id: ex.id,
    name: ex.name,
    bodyPart: ex.bodyPart,
    target: ex.target,
    equipment: ex.equipment,
    gifUrl: ex.gifUrl,
  };
}

export function parseCatalogBrowseStep(raw: string | null): CatalogBrowseStep {
  if (raw === "muscle" || raw === "equipment" || raw === "list") return raw;
  return "zone";
}

export function exerciseZone(ex: BrowseableExercise): string | null {
  const target = ex.target?.toLowerCase();
  const inferred = target ? inferBodyPartFromTarget(target) : undefined;
  const bp = ex.bodyPart?.toLowerCase();
  return inferred ?? bp ?? null;
}

export function filterCatalogExercises(
  items: ExerciseDBExercise[],
): ExerciseDBExercise[] {
  return items.filter(
    (ex) =>
      ex.bodyPart !== "cardio" &&
      !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)),
  );
}

export function sortBrowseableByLatestPerf<T extends BrowseableExercise>(
  exercises: T[],
  getLatestAt: (id: string) => number | null,
): T[] {
  return [...exercises].sort((a, b) => {
    const ta = getLatestAt(a.id);
    const tb = getLatestAt(b.id);
    if (ta !== null && tb !== null) return tb - ta;
    if (ta !== null) return -1;
    if (tb !== null) return 1;
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });
}

export type BrowseSearchSort = "popularity" | "latestPerf";

/** Filtre par nom (FR/EN) pour le mode recherche globale. */
export function filterBrowseableBySearch<T extends BrowseableExercise>(
  exercises: T[],
  searchQuery: string,
  sort: BrowseSearchSort = "popularity",
  getLatestAt?: (id: string) => number | null,
): T[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];

  const apiQuery = translateSearchQueryToEnglish(trimmed).toLowerCase();
  const searchRaw = trimmed.toLowerCase();

  const matched = exercises.filter((ex) => {
    const name = ex.name.toLowerCase();
    const orig = (ex.originalName ?? ex.name).toLowerCase();
    const matchEn =
      (apiQuery && name.includes(apiQuery)) ||
      (apiQuery && orig.includes(apiQuery));
    const matchFr =
      (searchRaw && name.includes(searchRaw)) ||
      (searchRaw && orig.includes(searchRaw));
    return matchEn || matchFr;
  });

  if (sort === "latestPerf" && getLatestAt) {
    return sortBrowseableByLatestPerf(matched, getLatestAt);
  }
  return sortExercisesByPopularity(matched as ExerciseDBExercise[]) as T[];
}

/** @deprecated Utiliser filterBrowseableBySearch */
export function filterCatalogBySearch(
  exercises: ExerciseDBExercise[],
  searchQuery: string,
): ExerciseDBExercise[] {
  return filterBrowseableBySearch(exercises, searchQuery, "popularity");
}

/** Exercices filtrés par zone seule ou zone + muscle (mode « voir tout »). */
export function exercisesForBrowseScope<T extends BrowseableExercise>(
  exercises: T[],
  zone: string | null,
  target: string | null,
): T[] {
  if (!zone) return [];
  const z = zone.toLowerCase();
  if (!target) {
    return exercises.filter((ex) => exerciseZone(ex) === z);
  }
  const t = target.toLowerCase();
  return exercises.filter((ex) => {
    if (exerciseZone(ex) !== z) return false;
    return (ex.target ?? "").toLowerCase() === t;
  });
}

export function exercisesForBrowsePath<T extends BrowseableExercise>(
  exercises: T[],
  zone: string | null,
  target: string | null,
  beq: string | null,
): T[] {
  if (!zone || !target || !beq) return [];
  const z = zone.toLowerCase();
  const t = target.toLowerCase();
  const eq = beq.toLowerCase();
  return exercises.filter((ex) => {
    if (exerciseZone(ex) !== z) return false;
    if ((ex.target ?? "").toLowerCase() !== t) return false;
    const exEq = (ex.equipment ?? "").trim().toLowerCase();
    if (eq === UNSPECIFIED_EQUIPMENT) return !exEq;
    return exEq === eq;
  });
}

export function countByZone(
  exercises: BrowseableExercise[],
): { zone: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    const z = exerciseZone(ex);
    if (!z) continue;
    counts.set(z, (counts.get(z) ?? 0) + 1);
  }
  const groups = orderedMuscleGroups(
    Object.fromEntries([...counts.keys()].map((k) => [k, []])),
  );
  return groups
    .filter((z) => counts.has(z))
    .map((zone) => ({ zone, count: counts.get(zone)! }));
}

export function countByTarget(
  exercises: BrowseableExercise[],
  zone: string,
): { target: string; count: number }[] {
  const z = zone.toLowerCase();
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    if (exerciseZone(ex) !== z) continue;
    const t = (ex.target ?? "").toLowerCase();
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([target, count]) => ({ target, count }));
}

export function countByEquipment(
  exercises: BrowseableExercise[],
  zone: string,
  target: string,
): { equipment: string; count: number }[] {
  const z = zone.toLowerCase();
  const t = target.toLowerCase();
  const counts = new Map<string, number>();
  let unspecified = 0;
  for (const ex of exercises) {
    if (exerciseZone(ex) !== z) continue;
    if ((ex.target ?? "").toLowerCase() !== t) continue;
    const eq = ex.equipment?.trim().toLowerCase();
    if (!eq) {
      unspecified += 1;
      continue;
    }
    counts.set(eq, (counts.get(eq) ?? 0) + 1);
  }
  if (unspecified > 0) {
    counts.set(UNSPECIFIED_EQUIPMENT, unspecified);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => {
      if (a === UNSPECIFIED_EQUIPMENT) return 1;
      if (b === UNSPECIFIED_EQUIPMENT) return -1;
      return a.localeCompare(b);
    })
    .map(([equipment, count]) => ({ equipment, count }));
}

export function browseParamsFromMuscleFilter(
  sel: MuscleSelection,
  availableTargets: string[],
): CatalogBrowseParams | null {
  const entries = Object.entries(sel).filter(
    ([, v]) => v === "all" || (Array.isArray(v) && v.length > 0),
  );
  if (entries.length === 0) {
    return { step: "zone", zone: null, target: null, beq: null };
  }

  const tree = buildTargetsByBodyPart(availableTargets);

  if (entries.length === 1) {
    const [group, v] = entries[0]!;
    const gl = group.toLowerCase();
    if (tree[gl]) {
      if (v === "all") {
        return { step: "muscle", zone: gl, target: null, beq: null };
      }
      if (Array.isArray(v) && v.length === 1) {
        return {
          step: "equipment",
          zone: gl,
          target: v[0]!.toLowerCase(),
          beq: null,
        };
      }
    }
  }

  return null;
}

export function muscleFilterFromBrowse(
  zone: string | null,
  target: string | null,
): MuscleSelection {
  if (!zone) return {};
  const z = zone.toLowerCase();
  if (!target) return { [z]: "all" };
  return { [z]: [target.toLowerCase()] };
}

export function equipmentFilterFromBrowse(
  beq: string | null,
): Record<string, "all"> {
  if (!beq) return {};
  return { [beq.toLowerCase()]: "all" };
}
