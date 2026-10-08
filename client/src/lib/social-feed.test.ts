import { describe, expect, it } from "vitest";
import {
  buildRecentSessionItems,
  buildTrainingNowItems,
  formatSocialSessionAgo,
} from "./social-feed";
import type { FriendListItem } from "@/lib/social-api";
import type { FriendPresence } from "@/types";

function friend(
  partial: Pick<FriendListItem, "userId" | "firstName"> &
    Partial<FriendListItem>,
): FriendListItem {
  return {
    friendshipId: `f-${partial.userId}`,
    userId: partial.userId,
    firstName: partial.firstName,
    lastName: partial.lastName ?? null,
    username: partial.username ?? null,
    avatarUrl: partial.avatarUrl ?? null,
    isPremium: partial.isPremium ?? false,
    status: partial.status ?? "accepted",
    direction: partial.direction ?? "friend",
    lastActiveDate: partial.lastActiveDate ?? null,
  };
}

function presence(
  userId: string,
  status: FriendPresence["status"],
  exerciseName: string | null = null,
): FriendPresence {
  return {
    userId,
    status,
    exerciseName,
    trackedExerciseId: null,
    lastHeartbeatAt: "2026-10-08T10:00:00.000Z",
  };
}

describe("buildTrainingNowItems", () => {
  it("ne garde que les potes acceptes en training", () => {
    const friends = [
      friend({ userId: "a", firstName: "Ambre" }),
      friend({ userId: "b", firstName: "Bob" }),
      friend({ userId: "c", firstName: "Cli", status: "pending" }),
    ];
    const map = new Map<string, FriendPresence>([
      ["a", presence("a", "training", "Squat")],
      ["b", presence("b", "online")],
      ["c", presence("c", "training")],
    ]);
    const items = buildTrainingNowItems(friends, map, "2026-10-08");
    expect(items.map((i) => i.userId)).toEqual(["a"]);
    expect(items[0]!.exerciseName).toBe("Squat");
    expect(items[0]!.sessionPath).toBe("/session/a/2026-10-08");
  });
});

describe("buildRecentSessionItems", () => {
  it("trie par date decroissante, ignore les potes sans seance et limite", () => {
    const friends = [
      friend({ userId: "a", firstName: "A", lastActiveDate: "2026-10-05" }),
      friend({ userId: "b", firstName: "B", lastActiveDate: "2026-10-07" }),
      friend({ userId: "c", firstName: "C", lastActiveDate: null }),
      friend({ userId: "d", firstName: "D", lastActiveDate: "2026-10-06" }),
    ];
    const items = buildRecentSessionItems(friends, 2);
    expect(items.map((i) => i.userId)).toEqual(["b", "d"]);
    expect(items[0]!.sessionPath).toBe("/session/b/2026-10-07");
  });
});

describe("formatSocialSessionAgo", () => {
  it("formate aujourd'hui, hier et il y a n jours", () => {
    expect(formatSocialSessionAgo("2026-10-08", "2026-10-08")).toBe(
      "Séance · aujourd'hui",
    );
    expect(formatSocialSessionAgo("2026-10-07", "2026-10-08")).toBe(
      "Séance · hier",
    );
    expect(formatSocialSessionAgo("2026-10-05", "2026-10-08")).toBe(
      "Séance · il y a 3 j",
    );
  });
});
