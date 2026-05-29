import {
  levelFromTotalXp,
  levelProgressFromTotalXp,
  xpRequiredForLevel,
} from '../lib/xp-levels.js';
import {
  getPersonalBestFromEntries,
  isNewPersonalBest,
} from '../lib/personal-best.js';
import { XP_AMOUNTS, XP_DAILY_CAPS } from '../lib/xp-config.js';

describe('xp-levels', () => {
  it('xpRequiredForLevel grows with level', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(2)).toBe(100);
    expect(xpRequiredForLevel(10)).toBeGreaterThan(xpRequiredForLevel(2));
  });

  it('level 1 at 0 totalXp has non-negative progress', () => {
    const p = levelProgressFromTotalXp(0);
    expect(p.level).toBe(1);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.xpForNextLevel).toBe(100);
  });

  it('levelFromTotalXp is at least 1', () => {
    expect(levelFromTotalXp(0)).toBe(1);
    const p = levelProgressFromTotalXp(500);
    expect(p.level).toBeGreaterThanOrEqual(1);
    expect(p.xpForNextLevel).toBeGreaterThan(0);
  });
});

describe('personal-best', () => {
  it('isNewPersonalBest compares weight then reps', () => {
    expect(
      isNewPersonalBest({ weight: 50, reps: 5 }, { weight: 55, reps: 1 }),
    ).toBe(true);
    expect(
      isNewPersonalBest({ weight: 50, reps: 5 }, { weight: 50, reps: 4 }),
    ).toBe(false);
  });

  it('getPersonalBestFromEntries', () => {
    expect(
      getPersonalBestFromEntries([
        { weight: 40, reps: 10 },
        { weight: 50, reps: 8 },
      ]),
    ).toEqual({ weight: 50, reps: 8 });
  });
});

describe('xp-config', () => {
  it('defines MVP amounts and caps', () => {
    expect(XP_AMOUNTS.perf).toBe(15);
    expect(XP_DAILY_CAPS.perf).toBe(30);
  });
});
