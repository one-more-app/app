import { monthActivityDateBounds, parseYearMonth } from '../lib/month-bounds.js';

describe('monthActivityDateBounds', () => {
  it('returns inclusive calendar bounds', () => {
    expect(monthActivityDateBounds('2026-02')).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
    expect(monthActivityDateBounds('2026-10')).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    });
  });

  it('rejects invalid month', () => {
    expect(() => parseYearMonth('2026-13')).toThrow();
    expect(() => parseYearMonth('26-10')).toThrow();
  });
});
