import {
  localIsoWeekday,
  localMinute,
  normalizeLocalHour,
  previousLocalMonthKey,
  isMonthlyRankingRecapWindow,
  formatFrenchMonthLabel,
} from '../lib/timezone.js';

describe('timezone reminder helpers', () => {
  it('maps a Thursday UTC noon to ISO weekday 4', () => {
    const thursday = new Date('2026-08-27T12:00:00Z');
    expect(localIsoWeekday('UTC', thursday)).toBe(4);
    expect(localIsoWeekday('Europe/Paris', thursday)).toBe(4);
  });

  it('maps Sunday to ISO weekday 7', () => {
    const sunday = new Date('2026-08-30T12:00:00Z');
    expect(localIsoWeekday('UTC', sunday)).toBe(7);
  });

  it('normalizes hour 24 to midnight', () => {
    expect(normalizeLocalHour(24)).toBe(0);
    expect(normalizeLocalHour(18)).toBe(18);
  });

  it('reads the local minute in a timezone', () => {
    const at = new Date('2026-08-27T12:05:00Z');
    expect(localMinute('UTC', at)).toBe(5);
    expect(localMinute('Europe/Paris', at)).toBe(5);
  });

  it('previousLocalMonthKey wraps from January', () => {
    expect(previousLocalMonthKey('UTC', new Date('2026-01-02T12:00:00Z'))).toBe(
      '2025-12',
    );
    expect(previousLocalMonthKey('UTC', new Date('2026-10-02T12:00:00Z'))).toBe(
      '2026-09',
    );
  });

  it('isMonthlyRankingRecapWindow only on local day 1 evening', () => {
    expect(
      isMonthlyRankingRecapWindow('UTC', new Date('2026-10-01T18:30:00Z')),
    ).toBe(true);
    expect(
      isMonthlyRankingRecapWindow('UTC', new Date('2026-10-02T18:30:00Z')),
    ).toBe(false);
    expect(
      isMonthlyRankingRecapWindow('UTC', new Date('2026-10-01T12:00:00Z')),
    ).toBe(false);
  });

  it('formatFrenchMonthLabel capitalizes month', () => {
    expect(formatFrenchMonthLabel('2026-09')).toMatch(/Septembre 2026/i);
  });
});
