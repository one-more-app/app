import { describe, expect, it } from "vitest";
import {
  UNSPECIFIED_EQUIPMENT,
  countByEquipment,
  countByTarget,
  countByZone,
  sortByTrackedThenCatalog,
  type BrowseableExercise,
} from "./exercise-catalog-browse";

function ex(
  partial: Pick<BrowseableExercise, "id" | "name"> &
    Partial<Omit<BrowseableExercise, "id" | "name">>,
): BrowseableExercise {
  return { ...partial };
}

describe("sortByTrackedThenCatalog", () => {
  it("priorise le nombre de suivis, puis le nombre catalogue", () => {
    const entries = [
      { zone: "chest", count: 20 },
      { zone: "back", count: 4 },
      { zone: "legs", count: 8 },
    ];
    const tracked = new Map([
      ["back", 3],
      ["legs", 3],
      ["chest", 1],
    ]);
    expect(
      sortByTrackedThenCatalog(entries, (e) => e.zone, tracked).map(
        (e) => e.zone,
      ),
    ).toEqual(["legs", "back", "chest"]);
  });

  it("à égalité de suivis et de catalogue, départage alphabétique fr", () => {
    const entries = [
      { zone: "shoulders", count: 2 },
      { zone: "chest", count: 2 },
    ];
    const tracked = new Map([
      ["shoulders", 1],
      ["chest", 1],
    ]);
    expect(
      sortByTrackedThenCatalog(entries, (e) => e.zone, tracked).map(
        (e) => e.zone,
      ),
    ).toEqual(["chest", "shoulders"]);
  });

  it("laisse le matériel non précisé en dernier", () => {
    const entries = [
      { equipment: UNSPECIFIED_EQUIPMENT, count: 1 },
      { equipment: "cable", count: 4 },
    ];
    const tracked = new Map([[UNSPECIFIED_EQUIPMENT, 5]]);
    expect(
      sortByTrackedThenCatalog(entries, (e) => e.equipment, tracked, {
        pinLastKey: UNSPECIFIED_EQUIPMENT,
      }).map((e) => e.equipment),
    ).toEqual(["cable", UNSPECIFIED_EQUIPMENT]);
  });
});

describe("countByZone", () => {
  it("trie par count décroissant (plus d'anatomique imposé)", () => {
    // Anatomique : chest avant back. Ici back a plus d'exos → back d'abord.
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "chest", target: "pectorals" }),
      ex({ id: "2", name: "b", bodyPart: "back", target: "lats" }),
      ex({ id: "3", name: "c", bodyPart: "back", target: "lats" }),
      ex({ id: "4", name: "d", bodyPart: "back", target: "lats" }),
    ];
    expect(countByZone(pool).map((e) => e.zone)).toEqual(["back", "chest"]);
    expect(countByZone(pool).map((e) => e.count)).toEqual([3, 1]);
  });

  it("à égalité de count, départage alphabétique fr", () => {
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "shoulders", target: "delts" }),
      ex({ id: "2", name: "b", bodyPart: "chest", target: "pectorals" }),
    ];
    expect(countByZone(pool).map((e) => e.zone)).toEqual(["chest", "shoulders"]);
  });
});

describe("countByTarget", () => {
  it("trie par count décroissant puis alphabétique", () => {
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "upper arms", target: "biceps" }),
      ex({ id: "2", name: "b", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "3", name: "c", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "4", name: "d", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "5", name: "e", bodyPart: "chest", target: "pectorals" }),
    ];
    const entries = countByTarget(pool, "upper arms");
    expect(entries.map((e) => e.target)).toEqual(["triceps", "biceps"]);
    expect(entries.map((e) => e.count)).toEqual([3, 1]);
  });

  it("à égalité de count, départage alphabétique", () => {
    const pool: BrowseableExercise[] = [
      ex({ id: "1", name: "a", bodyPart: "upper arms", target: "triceps" }),
      ex({ id: "2", name: "b", bodyPart: "upper arms", target: "biceps" }),
    ];
    expect(countByTarget(pool, "upper arms").map((e) => e.target)).toEqual([
      "biceps",
      "triceps",
    ]);
  });
});

describe("countByEquipment", () => {
  it("trie par count décroissant puis alphabétique", () => {
    const pool: BrowseableExercise[] = [
      ex({
        id: "1",
        name: "a",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "dumbbell",
      }),
      ex({
        id: "2",
        name: "b",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "barbell",
      }),
      ex({
        id: "3",
        name: "c",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "barbell",
      }),
      ex({
        id: "4",
        name: "d",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "barbell",
      }),
    ];
    const entries = countByEquipment(pool, "chest", "pectorals");
    expect(entries.map((e) => e.equipment)).toEqual(["barbell", "dumbbell"]);
    expect(entries.map((e) => e.count)).toEqual([3, 1]);
  });

  it("place __unspecified__ en dernier même si count élevé", () => {
    const pool: BrowseableExercise[] = [
      ex({
        id: "1",
        name: "a",
        bodyPart: "chest",
        target: "pectorals",
        equipment: "cable",
      }),
      ex({ id: "2", name: "b", bodyPart: "chest", target: "pectorals" }),
      ex({ id: "3", name: "c", bodyPart: "chest", target: "pectorals" }),
      ex({ id: "4", name: "d", bodyPart: "chest", target: "pectorals" }),
    ];
    const entries = countByEquipment(pool, "chest", "pectorals");
    expect(entries.map((e) => e.equipment)).toEqual([
      "cable",
      UNSPECIFIED_EQUIPMENT,
    ]);
    expect(entries.map((e) => e.count)).toEqual([1, 3]);
  });
});
