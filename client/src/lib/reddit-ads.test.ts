import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureRedditClickIdFromUrl,
  extractRedditClickIdFromUrl,
  redditAdsBodyFields,
  setRedditAdsMatch,
} from "./reddit-ads";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage(),
    configurable: true,
  });
});

afterEach(() => {
  localStorage.clear();
});

describe("extractRedditClickIdFromUrl", () => {
  it("reads rdt_cid from query and hash", () => {
    expect(
      extractRedditClickIdFromUrl(
        "https://one-more.app/?rdt_cid=click_from_query",
      ),
    ).toBe("click_from_query");
    expect(
      extractRedditClickIdFromUrl(
        "https://one-more.app/#/auth?rdt_cid=click_from_hash",
      ),
    ).toBe("click_from_hash");
  });
});

describe("redditAdsBodyFields", () => {
  it("returns stored click id and advertising ids", () => {
    setRedditAdsMatch({
      redditClickId: "abc",
      idfa: "EA7583CD-A667-48BC-B806-42ECB2B48606",
    });
    expect(redditAdsBodyFields()).toEqual({
      redditClickId: "abc",
      idfa: "EA7583CD-A667-48BC-B806-42ECB2B48606",
    });
  });

  it("captures rdt_cid from a URL into storage", () => {
    captureRedditClickIdFromUrl("https://one-more.app/?rdt_cid=from-url");
    expect(redditAdsBodyFields()).toEqual({ redditClickId: "from-url" });
  });
});
