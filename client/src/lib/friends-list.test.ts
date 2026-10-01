import { describe, expect, it } from "vitest";
import { compareFriendsByRecentActivity } from "./friends-list";
import type { FriendListItem } from "@/lib/social-api";

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
    status: "accepted",
    direction: "friend",
    lastActiveDate: partial.lastActiveDate ?? null,
  };
}

describe("compareFriendsByRecentActivity", () => {
  it("trie par dernier message décroissant", () => {
    const a = friend({ userId: "a", firstName: "A" });
    const b = friend({ userId: "b", firstName: "B" });
    const map = new Map<string, string | null>([
      ["a", "2026-10-01T10:00:00.000Z"],
      ["b", "2026-10-01T12:00:00.000Z"],
    ]);
    expect(
      [a, b].sort((x, y) => compareFriendsByRecentActivity(x, y, map)).map(
        (f) => f.userId,
      ),
    ).toEqual(["b", "a"]);
  });

  it("place les amis avec message avant ceux sans", () => {
    const withMsg = friend({
      userId: "m",
      firstName: "Msg",
      lastActiveDate: "2026-01-01",
    });
    const noMsg = friend({
      userId: "n",
      firstName: "No",
      lastActiveDate: "2026-10-01",
    });
    const map = new Map<string, string | null>([
      ["m", "2026-09-01T10:00:00.000Z"],
    ]);
    expect(
      [noMsg, withMsg]
        .sort((x, y) => compareFriendsByRecentActivity(x, y, map))
        .map((f) => f.userId),
    ).toEqual(["m", "n"]);
  });

  it("sans message, trie par lastActiveDate décroissant", () => {
    const older = friend({
      userId: "old",
      firstName: "Old",
      lastActiveDate: "2026-09-01",
    });
    const newer = friend({
      userId: "new",
      firstName: "New",
      lastActiveDate: "2026-10-01",
    });
    const map = new Map<string, string | null>();
    expect(
      [older, newer]
        .sort((x, y) => compareFriendsByRecentActivity(x, y, map))
        .map((f) => f.userId),
    ).toEqual(["new", "old"]);
  });

  it("à égalité de message, départage alphabétique FR", () => {
    const leo = friend({ userId: "1", firstName: "Léo" });
    const alice = friend({ userId: "2", firstName: "Alice" });
    const at = "2026-10-01T10:00:00.000Z";
    const map = new Map<string, string | null>([
      ["1", at],
      ["2", at],
    ]);
    expect(
      [leo, alice]
        .sort((x, y) => compareFriendsByRecentActivity(x, y, map))
        .map((f) => f.firstName),
    ).toEqual(["Alice", "Léo"]);
  });
});
