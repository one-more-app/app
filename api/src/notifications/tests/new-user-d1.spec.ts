import {
  isNewUserD1ReferralDue,
  isNewUserD1TrainingSlot,
  middayReferralMinuteOfDay,
  previousLocalDateKey,
  shiftLocalDateKey,
} from '../lib/new-user-d1.js';

describe('new-user-d1 helpers', () => {
  it('shifts a local date key across month boundaries', () => {
    expect(shiftLocalDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftLocalDateKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftLocalDateKey('2026-09-25', 1)).toBe('2026-09-26');
  });

  it('returns yesterday local date key for UTC', () => {
    const at = new Date('2026-09-26T10:00:00Z');
    expect(previousLocalDateKey('UTC', at)).toBe('2026-09-25');
  });

  it('maps training slots only at minute 0 of 7 / 11 / 16', () => {
    expect(isNewUserD1TrainingSlot('UTC', new Date('2026-09-26T07:00:00Z'))).toBe(
      7,
    );
    expect(isNewUserD1TrainingSlot('UTC', new Date('2026-09-26T11:00:00Z'))).toBe(
      11,
    );
    expect(isNewUserD1TrainingSlot('UTC', new Date('2026-09-26T16:00:00Z'))).toBe(
      16,
    );
    expect(
      isNewUserD1TrainingSlot('UTC', new Date('2026-09-26T07:01:00Z')),
    ).toBeNull();
    expect(
      isNewUserD1TrainingSlot('UTC', new Date('2026-09-26T12:00:00Z')),
    ).toBeNull();
  });

  it('picks a stable midday minute in [12:00, 14:00)', () => {
    const minute = middayReferralMinuteOfDay('user-a', '2026-09-26');
    expect(minute).toBeGreaterThanOrEqual(12 * 60);
    expect(minute).toBeLessThan(14 * 60);
    expect(middayReferralMinuteOfDay('user-a', '2026-09-26')).toBe(minute);
    expect(middayReferralMinuteOfDay('user-b', '2026-09-26')).not.toBe(minute);
  });

  it('fires referral only on the hashed minute', () => {
    const userId = 'user-a';
    const day = '2026-09-26';
    const minuteOfDay = middayReferralMinuteOfDay(userId, day);
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    const dueAt = new Date(Date.UTC(2026, 8, 26, hour, minute, 0));
    expect(isNewUserD1ReferralDue(userId, 'UTC', dueAt)).toBe(true);
    expect(
      isNewUserD1ReferralDue(
        userId,
        'UTC',
        new Date(dueAt.getTime() + 60_000),
      ),
    ).toBe(false);
  });
});
