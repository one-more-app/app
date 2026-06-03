import {
  applyStreakXpMultiplier,
  streakXpBonusPercent,
  streakXpMaxStreakDays,
  streakXpMultiplier,
  streakXpProgress,
} from '../lib/streak-xp-multiplier.js';

describe('streak-xp-multiplier', () => {
  it('returns 0 bonus with no streak', () => {
    expect(streakXpBonusPercent(0)).toBe(0);
    expect(streakXpMultiplier(0)).toBe(1);
  });

  it('adds +5% per day from day 1', () => {
    expect(streakXpBonusPercent(1)).toBe(5);
    expect(streakXpBonusPercent(7)).toBe(35);
    expect(streakXpBonusPercent(20)).toBe(100);
  });

  it('caps at +500% (×6) from day 100', () => {
    const maxDay = streakXpMaxStreakDays();
    expect(maxDay).toBe(100);
    expect(streakXpBonusPercent(99)).toBe(495);
    expect(streakXpBonusPercent(100)).toBe(500);
    expect(streakXpBonusPercent(200)).toBe(500);
    expect(streakXpMultiplier(200)).toBe(6);
  });

  it('applyStreakXpMultiplier floors amounts', () => {
    expect(applyStreakXpMultiplier(15, 20)).toBe(30);
    expect(applyStreakXpMultiplier(40, 20)).toBe(80);
    expect(applyStreakXpMultiplier(15, 0)).toBe(15);
  });

  it('streakXpProgress reports days to max', () => {
    const at20 = streakXpProgress(20);
    expect(at20.bonusPercent).toBe(100);
    expect(at20.isMax).toBe(false);
    expect(at20.daysToMax).toBe(80);

    const atMax = streakXpProgress(150);
    expect(atMax.isMax).toBe(true);
    expect(atMax.daysToMax).toBe(0);
    expect(atMax.progressToMax).toBe(100);
  });
});
