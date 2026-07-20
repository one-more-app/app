import type {
  EventActiveCelebration,
  EventExerciseMedia,
  EventLeaderboardBoard,
  EventLeaderboardRow,
} from "@/lib/event-api";
import type { EventExerciseSlug, EventGenderSlug } from "@/lib/event-constants";

/** Célébration avec prénom, nom et reps longs pour prévisualiser l’overlay TV. */
export const EVENT_DEMO_CELEBRATION: EventActiveCelebration = {
  entryId: "demo-celebration",
  firstName: "Jean-Baptiste",
  lastName: "De La Fontaine-Château",
  displayName: "Jean-Baptiste De La Fontaine-Château",
  reps: 47,
  exercise: "pull_up",
  gender: "male",
};

const DEMO_FIRST_NAMES = [
  "Jean-Baptiste",
  "Marie-Claire",
  "Alexandre",
  "Sophie",
  "Thomas",
  "Camille",
  "Nicolas",
  "Émilie",
  "Julien",
  "Laura",
  "Maxime",
  "Isabelle",
  "Antoine",
  "Chloé",
  "Pierre",
  "Manon",
  "Romain",
  "Julie",
  "Lucas",
  "Anaïs",
  "Hugo",
  "Pauline",
  "Louis",
  "Claire",
  "Gabriel",
  "Océane",
  "Arthur",
  "Sarah",
  "Enzo",
  "Léa",
] as const;

const DEMO_LAST_NAMES = [
  "De La Fontaine-Château",
  "Dupont-Martin",
  "Bernard",
  "Legrand-Rousseau",
  "Petit",
  "Moreau-Lefèvre",
  "Garcia",
  "Fontaine",
  "Bonnet-Saint-Martin",
  "Chevalier",
  "Durand-Villeneuve",
  "Montgomery-Fitzgerald",
  "Leroy",
  "Dubois-Perrot",
  "Girard",
  "Mercier-Bouchard",
  "Blanchet-Deschamps",
  "Henry",
  "Masson-Delorme",
  "Renard",
  "Perrin",
  "Faure",
  "Lambert",
  "Roux",
  "Simon",
  "Michel",
  "Lefebvre",
  "Robert",
  "Richard",
  "David",
] as const;

function demoRow(
  id: string,
  firstName: string,
  lastName: string,
  reps: number,
  rank: number,
): EventLeaderboardRow {
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;
  return { id, firstName, displayName, reps, rank };
}

function buildDemoRows(prefix: string, count: number, startReps: number): EventLeaderboardRow[] {
  return Array.from({ length: count }, (_, index) => {
    const firstName = DEMO_FIRST_NAMES[index % DEMO_FIRST_NAMES.length]!;
    const lastName = DEMO_LAST_NAMES[(index * 5 + 3) % DEMO_LAST_NAMES.length]!;
    return demoRow(`${prefix}${index}`, firstName, lastName, startReps - index, index + 1);
  });
}

const DEMO_PULL_UP_MALE = buildDemoRows("pu-m-", 30, 47);
const DEMO_PULL_UP_FEMALE = buildDemoRows("pu-f-", 28, 39);
const DEMO_DIPS_MALE = buildDemoRows("d-m-", 26, 52);
const DEMO_DIPS_FEMALE = buildDemoRows("d-f-", 24, 44);
const DEMO_PUSH_UP_MALE = buildDemoRows("puu-m-", 30, 78);
const DEMO_PUSH_UP_FEMALE = buildDemoRows("puu-f-", 27, 65);

/** Classement complet pour prévisualiser colonnes + roulement. */
export function buildEventDemoBoard(): EventLeaderboardBoard {
  return {
    pull_up: {
      male: DEMO_PULL_UP_MALE,
      female: DEMO_PULL_UP_FEMALE,
    },
    dips: {
      male: DEMO_DIPS_MALE,
      female: DEMO_DIPS_FEMALE,
    },
    push_up: {
      male: DEMO_PUSH_UP_MALE,
      female: DEMO_PUSH_UP_FEMALE,
    },
  };
}

export function buildEventDemoExerciseMedia(): Record<
  EventExerciseSlug,
  EventExerciseMedia
> {
  return {
    pull_up: { gifUrl: null, name: "Pull-up", nameFr: "Tractions" },
    dips: { gifUrl: null, name: "Chest Dip", nameFr: "Dips" },
    push_up: { gifUrl: null, name: "Push-up", nameFr: "Pompes" },
  };
}

function readDemoSearchParams(search: string): URLSearchParams {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query);
}

export function isEventLeaderboardDemoMode(search: string): boolean {
  const demo = readDemoSearchParams(search).get("demo");
  return demo === "celebration" || demo === "1" || demo === "true";
}

export function eventLeaderboardDemoGender(search: string): EventGenderSlug | null {
  const value = readDemoSearchParams(search).get("gender");
  if (value === "male" || value === "female") return value;
  return null;
}
