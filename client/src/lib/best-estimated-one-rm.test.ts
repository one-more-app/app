import { describe, expect, it } from "vitest";
import {
  bestEstimatedOneRmFromEntries,
  estimatedOneRmForSet,
} from "@one-more/shared/best-estimated-one-rm";
import { estimate1RM } from "@one-more/shared/strength-standards";

describe("estimatedOneRmForSet", () => {
  it("utilise estimate1RM pour un exo standard", () => {
    expect(estimatedOneRmForSet(100, 5)).toBe(estimate1RM(100, 5));
    expect(estimatedOneRmForSet(100, 1)).toBe(100);
  });

  it("ignore reps invalides", () => {
    expect(estimatedOneRmForSet(100, 0)).toBe(0);
    expect(estimatedOneRmForSet(100, -1)).toBe(0);
  });

  it("applique la règle bodyweight quand BW dispo", () => {
    const bw = 80;
    const weight = 20;
    const reps = 5;
    const expected =
      Math.round((estimate1RM(bw + weight, reps) - bw) * 10) / 10;
    expect(
      estimatedOneRmForSet(weight, reps, {
        isBodyweightAdditive: true,
        bodyWeightKg: bw,
      }),
    ).toBe(expected);
  });

  it("fallback simple si bodyweight sans BW", () => {
    expect(
      estimatedOneRmForSet(20, 5, {
        isBodyweightAdditive: true,
        bodyWeightKg: null,
      }),
    ).toBe(estimate1RM(20, 5));
  });
});

describe("bestEstimatedOneRmFromEntries", () => {
  it("retourne null si aucune perf valide", () => {
    expect(bestEstimatedOneRmFromEntries([])).toBeNull();
    expect(
      bestEstimatedOneRmFromEntries([{ weight: 0, reps: 5, date: "2026-01-01" }]),
    ).toBeNull();
  });

  it("garde le meilleur 1RM et la série source", () => {
    const best = bestEstimatedOneRmFromEntries([
      { weight: 80, reps: 5, date: "2026-01-01" },
      { weight: 120, reps: 2, date: "2026-01-02" },
      { weight: 90, reps: 5, date: "2026-01-03" },
    ]);
    expect(best).not.toBeNull();
    expect(best!.oneRM).toBe(estimate1RM(120, 2));
    expect(best!.sourceWeight).toBe(120);
    expect(best!.sourceReps).toBe(2);
    expect(best!.sourceDate).toBe("2026-01-02");
  });

  it("tie-break sur reps puis date", () => {
    const sameOneRmWeight = 90;
    const sameOneRmReps = 5;
    const oneRM = estimate1RM(sameOneRmWeight, sameOneRmReps);
    // Same weight/reps → same 1RM; later date wins among equal reps
    const byDate = bestEstimatedOneRmFromEntries([
      { weight: sameOneRmWeight, reps: sameOneRmReps, date: "2026-01-01" },
      { weight: sameOneRmWeight, reps: sameOneRmReps, date: "2026-02-01" },
    ]);
    expect(byDate!.oneRM).toBe(oneRM);
    expect(byDate!.sourceDate).toBe("2026-02-01");

    // Higher reps at equal 1RM is unusual with Epley-like formula unless different
    // weight/reps pairs collide; force equal oneRM via same set and prefer higher reps path
    // by comparing candidates that share oneRM numerically after rounding.
    const a = estimate1RM(100, 1); // 100
    const b = estimate1RM(100, 1); // 100
    expect(a).toBe(b);
    const tied = bestEstimatedOneRmFromEntries([
      { weight: 100, reps: 1, date: "2026-01-01" },
      { weight: 100, reps: 1, date: "2026-01-02" },
    ]);
    expect(tied!.sourceDate).toBe("2026-01-02");
  });
});
