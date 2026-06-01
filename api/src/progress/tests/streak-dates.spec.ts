import {
  calendarDaysBetween,
  computeStreakAfterActivity,
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

  it('computeStreakAfterActivity resets after a gap', () => {
    expect(
      computeStreakAfterActivity('2024-06-07', 10, '2024-06-10'),
    ).toEqual({ current: 1 });
  });

  it('computeStreakAfterActivity keeps streak on same calendar day', () => {
    expect(
      computeStreakAfterActivity('2024-06-10', 3, '2024-06-10'),
    ).toEqual({ current: 3 });
  });
});
