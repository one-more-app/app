import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasSeenRankingRecap, markRankingRecapSeen } from "./ranking-recap-seen";

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => store.clear()),
  };
}

describe("ranking-recap-seen", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retourne false tant que le récap du mois n'est pas marqué", () => {
    expect(hasSeenRankingRecap("2026-09")).toBe(false);
  });

  it("retourne true après markRankingRecapSeen pour ce mois uniquement", () => {
    markRankingRecapSeen("2026-09");
    expect(hasSeenRankingRecap("2026-09")).toBe(true);
    expect(hasSeenRankingRecap("2026-08")).toBe(false);
  });

  it("écrit la clé ranking-recap-seen:<mois>", () => {
    markRankingRecapSeen("2026-09");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "ranking-recap-seen:2026-09",
      "1",
    );
  });

  it("fail closed : true si localStorage lève à la lecture", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => undefined,
    });
    expect(hasSeenRankingRecap("2026-09")).toBe(true);
  });

  it("ignore les erreurs d'écriture", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(() => markRankingRecapSeen("2026-09")).not.toThrow();
  });
});
