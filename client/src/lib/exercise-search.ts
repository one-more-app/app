import type { BrowseableExercise } from "@/lib/exercise-catalog-browse";
import { EXERCISE_SEARCH_ALIASES } from "@/lib/exercise-search-aliases";
import {
  EXERCISE_NAMES,
  translateSearchQueryToEnglish,
} from "@/lib/exercise-translations";
import fuzzysort from "fuzzysort";

/** Lowercase + sans accents pour matching stable. */
export function normalizeSearchText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type SearchableExercise<T extends BrowseableExercise> = T & {
  _name: string;
  _orig: string;
  _fr: string;
  _aliasList: string[];
  _popular: boolean;
};

const ALIAS_ENTRIES = Object.entries(EXERCISE_SEARCH_ALIASES).map(
  ([alias, targets]) =>
    [normalizeSearchText(alias), targets.map(normalizeSearchText)] as const,
);

function frenchLabelFor(name: string): string {
  const key = name.trim().toLowerCase();
  return EXERCISE_NAMES[key] ?? "";
}

function aliasesForName(nameNorm: string): string[] {
  const hits: string[] = [];
  for (const [alias, targets] of ALIAS_ENTRIES) {
    if (targets.some((t) => nameNorm.includes(t))) {
      hits.push(alias);
    }
  }
  return hits;
}

function prepareExercises<T extends BrowseableExercise>(
  exercises: T[],
): SearchableExercise<T>[] {
  return exercises.map((ex) => {
    const name = ex.name ?? "";
    const orig = ex.originalName ?? name;
    const nameNorm = normalizeSearchText(name);
    const origNorm = normalizeSearchText(orig);
    const fr = frenchLabelFor(name) || frenchLabelFor(orig);
    const aliasList = aliasesForName(nameNorm);
    if (aliasList.length === 0) {
      const fromOrig = aliasesForName(origNorm);
      for (const a of fromOrig) {
        if (!aliasList.includes(a)) aliasList.push(a);
      }
    }
    return {
      ...ex,
      _name: nameNorm,
      _orig: origNorm,
      _fr: normalizeSearchText(fr),
      _aliasList: aliasList,
      _popular: Boolean(
        EXERCISE_NAMES[name.trim().toLowerCase()] ||
          EXERCISE_NAMES[orig.trim().toLowerCase()],
      ),
    };
  });
}

const SEARCH_KEYS = ["_name", "_orig", "_fr"] as const;

/** Seuil fuzzysort v3 (1 = parfait, 0 = faible). */
const FUZZY_THRESHOLD = 0.28;
/** Bonus score pour match alias exact. */
const ALIAS_EXACT_SCORE = 0.95;
/** Bonus popularité (dico EXERCISE_NAMES). */
const POPULARITY_BOOST = 0.08;

/** Transpositions adjacentes pour typos type "benhc" → "bench". */
function adjacentSwaps(s: string): string[] {
  if (s.length < 2) return [];
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) {
    const chars = s.split("");
    const tmp = chars[i]!;
    chars[i] = chars[i + 1]!;
    chars[i + 1] = tmp;
    out.push(chars.join(""));
  }
  return out;
}

function bestKeysScore<T extends BrowseableExercise>(
  query: string,
  prepared: SearchableExercise<T>[],
): Map<string, number> {
  const scores = new Map<string, number>();
  if (!query) return scores;

  // Requêtes très courtes : substring / préfixe uniquement (évite le bruit fuzzy)
  if (query.length <= 2) {
    for (const ex of prepared) {
      const haystacks = [ex._name, ex._orig, ex._fr].filter(Boolean);
      const hit = haystacks.some(
        (h) => h.includes(query) || h.split(/\s+/).some((w) => w.startsWith(query)),
      );
      if (hit) scores.set(ex.id, 0.7);
    }
    return scores;
  }

  const results = fuzzysort.go(query, prepared, {
    keys: [...SEARCH_KEYS],
    threshold: FUZZY_THRESHOLD,
  });

  for (const r of results) {
    const id = r.obj.id;
    const prev = scores.get(id) ?? 0;
    if (r.score > prev) scores.set(id, r.score);
  }
  return scores;
}

/**
 * Matching multi-tokens indépendant de l'ordre :
 * chaque mot doit matcher au moins une clé ; score = moyenne des meilleurs.
 */
function tokenAndScores<T extends BrowseableExercise>(
  tokens: string[],
  prepared: SearchableExercise<T>[],
): Map<string, number> {
  const scores = new Map<string, number>();
  if (tokens.length < 2) return scores;

  const perToken: Map<string, number>[] = tokens.map((token) =>
    bestKeysScore(token, prepared),
  );

  for (const ex of prepared) {
    let sum = 0;
    let ok = true;
    for (const map of perToken) {
      const s = map.get(ex.id);
      if (s === undefined) {
        ok = false;
        break;
      }
      sum += s;
    }
    if (ok) scores.set(ex.id, sum / tokens.length);
  }
  return scores;
}

function aliasExactScores<T extends BrowseableExercise>(
  query: string,
  prepared: SearchableExercise<T>[],
): Map<string, number> {
  const scores = new Map<string, number>();
  if (!query) return scores;
  for (const ex of prepared) {
    if (ex._aliasList.some((a) => a === query || a.startsWith(query))) {
      scores.set(ex.id, ALIAS_EXACT_SCORE);
    }
  }
  return scores;
}

function mergeScores(
  into: Map<string, number>,
  from: Map<string, number>,
): void {
  for (const [id, score] of from) {
    const prev = into.get(id) ?? 0;
    if (score > prev) into.set(id, score);
  }
}

function buildQueryVariants(raw: string): string[] {
  const normalized = normalizeSearchText(raw);
  const translated = normalizeSearchText(translateSearchQueryToEnglish(raw));
  const variants = new Set<string>();
  if (normalized) variants.add(normalized);
  if (translated && translated !== normalized) variants.add(translated);

  // Alias exact / préfixe de saisie → fragments EN (ex. "sdt" / "sd" → "deadlift")
  for (const [alias, targets] of ALIAS_ENTRIES) {
    if (
      normalized === alias ||
      (normalized.length >= 2 && alias.startsWith(normalized))
    ) {
      for (const t of targets) variants.add(t);
    }
  }

  // Typos par transposition (sur la query utilisateur normalisée uniquement)
  if (normalized.length >= 4) {
    for (const swapped of adjacentSwaps(normalized)) {
      variants.add(swapped);
    }
  }

  return [...variants];
}

/**
 * Recherche fuzzy multi-clés (EN, FR, aliases, typos, ordre des mots).
 * Retourne les exercices triés par pertinence (score + boost popularité).
 */
export function searchBrowseableExercises<T extends BrowseableExercise>(
  exercises: T[],
  searchQuery: string,
): T[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];

  const prepared = prepareExercises(exercises);
  const preparedById = new Map(prepared.map((ex) => [ex.id, ex]));
  const originalById = new Map(exercises.map((ex) => [ex.id, ex]));
  const scores = new Map<string, number>();

  const normalized = normalizeSearchText(trimmed);
  mergeScores(scores, aliasExactScores(normalized, prepared));

  const variants = buildQueryVariants(trimmed);
  for (const q of variants) {
    mergeScores(scores, bestKeysScore(q, prepared));
    const tokens = q.split(/\s+/).filter(Boolean);
    mergeScores(scores, tokenAndScores(tokens, prepared));
  }

  if (scores.size === 0) return [];

  return [...scores.entries()]
    .map(([id, score]) => {
      const preparedEx = preparedById.get(id)!;
      const boosted = score + (preparedEx._popular ? POPULARITY_BOOST : 0);
      return { id, boosted, name: preparedEx.name };
    })
    .sort((a, b) => {
      if (b.boosted !== a.boosted) return b.boosted - a.boosted;
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    })
    .map(({ id }) => originalById.get(id)!)
    .filter(Boolean);
}
