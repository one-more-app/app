import { sortXpAggRows, withRanks } from '../lib/rank-entries.js';

describe('sortXpAggRows', () => {
  it('orders by xp desc, then lastEarnedAt desc, then userId asc', () => {
    const a = {
      userId: 'a',
      xp: 100,
      lastEarnedAt: new Date('2026-10-01T10:00:00Z'),
    };
    const b = {
      userId: 'b',
      xp: 100,
      lastEarnedAt: new Date('2026-10-02T10:00:00Z'),
    };
    const c = { userId: 'c', xp: 50, lastEarnedAt: null };
    expect(sortXpAggRows([a, c, b]).map((r) => r.userId)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });
});

describe('withRanks', () => {
  it('assigns dense ranks 1..n after sort', () => {
    const ranked = withRanks([
      { userId: 'x', xp: 10, lastEarnedAt: null },
      { userId: 'y', xp: 20, lastEarnedAt: null },
    ]);
    expect(ranked.map((r) => [r.userId, r.rank])).toEqual([
      ['y', 1],
      ['x', 2],
    ]);
  });
});
