/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearRestFinishedDeepLinkFromUrl,
  navigateHashRoute,
  parseRestFinishedNotificationUrl,
  REST_TIMER_FINISHED_DEEP_LINK_PARAM,
} from "./rest-timer-local-notifications";

function installMockWindow(hash: string) {
  let currentHash = hash.startsWith("#") ? hash : `#${hash}`;
  const replaceState = vi.fn(
    (_state: unknown, _title: string, url?: string | null) => {
      if (typeof url !== "string") return;
      const idx = url.indexOf("#");
      currentHash = idx >= 0 ? url.slice(idx) : "";
    },
  );

  const location = {
    pathname: "/",
    search: "",
    get hash() {
      return currentHash;
    },
    set hash(next: string) {
      currentHash = next.startsWith("#") ? next : `#${next}`;
    },
  };

  vi.stubGlobal("window", {
    location,
    history: {
      state: null,
      length: 1,
      replaceState,
    },
  });

  return { replaceState, getHash: () => currentHash };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseRestFinishedNotificationUrl", () => {
  it("retourne la route propre sans query jetable", () => {
    const parsed = parseRestFinishedNotificationUrl(
      `https://app.example/#/exercise/abc?${REST_TIMER_FINISHED_DEEP_LINK_PARAM}=1`,
    );
    expect(parsed).toEqual({
      route: "/exercise/abc",
      exerciseId: "abc",
    });
  });
});

describe("navigateHashRoute", () => {
  it("assigne location.hash quand le path change", () => {
    const { replaceState, getHash } = installMockWindow("#/home");

    navigateHashRoute("/exercise/abc");

    expect(getHash()).toBe("#/exercise/abc");
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("remplace sans assigner hash quand déjà sur le même path", () => {
    const { replaceState, getHash } = installMockWindow(
      `#/exercise/abc?${REST_TIMER_FINISHED_DEEP_LINK_PARAM}=1`,
    );

    navigateHashRoute("/exercise/abc");

    expect(replaceState).toHaveBeenCalled();
    expect(getHash()).toBe("#/exercise/abc");
  });
});

describe("clearRestFinishedDeepLinkFromUrl", () => {
  it("nettoie le query via replaceState", () => {
    const { replaceState, getHash } = installMockWindow(
      `#/exercise/abc?${REST_TIMER_FINISHED_DEEP_LINK_PARAM}=1`,
    );

    clearRestFinishedDeepLinkFromUrl();

    expect(replaceState).toHaveBeenCalled();
    expect(getHash()).toBe("#/exercise/abc");
  });
});
