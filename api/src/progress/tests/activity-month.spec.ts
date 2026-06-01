import {
  monthKeyFromDate,
  monthRangeBounds,
  parseMonthKey,
  shiftMonthKey,
} from '../lib/activity-month.js';

describe('activity-month', () => {
  it('parses and bounds a month', () => {
    expect(parseMonthKey('2024-06')).toEqual({ year: 2024, month: 6 });
    expect(monthRangeBounds('2024-06')).toEqual({
      start: '2024-06-01',
      end: '2024-06-30',
    });
  });

  it('shifts months', () => {
    expect(shiftMonthKey('2024-12', 1)).toBe('2025-01');
    expect(shiftMonthKey('2024-01', -1)).toBe('2023-12');
  });

  it('formats month key from date', () => {
    expect(monthKeyFromDate(new Date(Date.UTC(2024, 5, 15)))).toBe('2024-06');
  });
});
