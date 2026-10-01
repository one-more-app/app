const key = (month: string) => `ranking-recap-seen:${month}`;

export function hasSeenRankingRecap(month: string): boolean {
  try {
    return localStorage.getItem(key(month)) === "1";
  } catch {
    return true; // fail closed : ne pas spammer
  }
}

export function markRankingRecapSeen(month: string): void {
  try {
    localStorage.setItem(key(month), "1");
  } catch {
    /* ignore */
  }
}
