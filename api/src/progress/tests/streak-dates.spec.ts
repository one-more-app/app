import {
  applyStreakExpiry,
  calendarDaysBetween,
  computeStreakAfterActivity,
  computeStreakFromActivityDates,
} from '../lib/streak-dates.js';

describe('streak-dates', () => {
  it('calendarDaysBetween counts calendar days', () => {
    expect(calendarDaysBetween('2024-06-01', '2024-06-02')).toBe(1);
    expect(calendarDaysBetween('2024-06-01', '2024-06-03')).toBe(2);
    expect(calendarDaysBetween('2024-06-02', '2024-06-01')).toBe(-1);
  });

  it('computeStreakAfterActivity starts at 1 with no last day', () => {
    expect(computeStreakAfterActivity(null, 0, '2024-06-10')).toEqual({
      current: 1,
    });
  });

  it('computeStreakAfterActivity increments on consecutive days', () => {
    expect(
      computeStreakAfterActivity('2024-06-09', 4, '2024-06-10'),
    ).toEqual({ current: 5 });
  });

  it('computeStreakAfterActivity continues after one rest day', () => {
    expect(
      computeStreakAfterActivity('2024-06-09', 4, '2024-06-11'),
    ).toEqual({ current: 5 });
  });

  it('computeStreakAfterActivity resets after two rest days', () => {
    expect(
      computeStreakAfterActivity('2024-06-07', 10, '2024-06-10'),
    ).toEqual({ current: 1 });
  });

  it('computeStreakAfterActivity keeps streak on same calendar day', () => {
    expect(
      computeStreakAfterActivity('2024-06-10', 3, '2024-06-10'),
    ).toEqual({ current: 3 });
  });

  it('applyStreakExpiry keeps streak for one day without activity', () => {
    expect(applyStreakExpiry('2024-06-10', 5, '2024-06-11')).toBe(5);
  });

  it('applyStreakExpiry clears streak after two days without activity', () => {
    expect(applyStreakExpiry('2024-06-10', 5, '2024-06-12')).toBe(0);
  });

  it('computeStreakFromActivityDates derives current and longest', () => {
    expect(computeStreakFromActivityDates([])).toEqual({
      current: 0,
      longest: 0,
    });
    expect(
      computeStreakFromActivityDates(
        ['2024-06-08', '2024-06-09', '2024-06-10'],
        '2024-06-10',
      ),
    ).toEqual({ current: 3, longest: 3 });
    expect(
      computeStreakFromActivityDates(
        ['2024-06-08', '2024-06-10', '2024-06-11'],
        '2024-06-11',
      ),
    ).toEqual({ current: 3, longest: 3 });
    expect(
      computeStreakFromActivityDates(
        ['2024-06-08', '2024-06-09', '2024-06-10'],
        '2024-06-12',
      ),
    ).toEqual({ current: 0, longest: 3 });
  });
});
