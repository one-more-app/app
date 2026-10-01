export type XpAggRow = {
  userId: string;
  xp: number;
  lastEarnedAt: Date | null;
};

export function sortXpAggRows<T extends XpAggRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    const at = a.lastEarnedAt?.getTime() ?? 0;
    const bt = b.lastEarnedAt?.getTime() ?? 0;
    if (bt !== at) return bt - at;
    return a.userId.localeCompare(b.userId);
  });
}

export function withRanks<T extends XpAggRow>(
  rows: T[],
): (T & { rank: number })[] {
  return sortXpAggRows(rows).map((row, i) => ({ ...row, rank: i + 1 }));
}
