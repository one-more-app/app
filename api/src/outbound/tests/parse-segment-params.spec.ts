import { describe, expect, it } from '@jest/globals';
import { parseSegmentDelayParams } from '../segments/parse-segment-params.js';

describe('parseSegmentDelayParams', () => {
  it('sums days and hours into a delay of at least 1 hour', () => {
    expect(parseSegmentDelayParams({ days: 1, hours: 12 }, 'seg')).toEqual({
      days: 1,
      hours: 12,
      totalHours: 36,
    });
  });

  it('accepts hours only', () => {
    expect(parseSegmentDelayParams({ hours: 2 }, 'seg').totalHours).toBe(2);
  });

  it('accepts days only', () => {
    expect(parseSegmentDelayParams({ days: 3 }, 'seg').totalHours).toBe(72);
  });

  it('rejects a zero delay', () => {
    expect(() => parseSegmentDelayParams({}, 'seg')).toThrow(
      'seg: fournir days et/ou hours (≥ 1 h au total)',
    );
    expect(() => parseSegmentDelayParams({ days: 0, hours: 0 }, 'seg')).toThrow(
      /days et\/ou hours/,
    );
  });

  it('parses numeric strings from n8n', () => {
    expect(
      parseSegmentDelayParams({ days: '1', hours: '6' }, 'seg').totalHours,
    ).toBe(30);
  });
});
