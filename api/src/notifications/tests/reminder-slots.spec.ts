import {
  normalizeReminderSlots,
  resolveReminderSlots,
} from '../lib/reminder-slots.js';

describe('reminder slots', () => {
  it('keeps one slot per weekday and sorts them', () => {
    expect(
      normalizeReminderSlots([
        { weekday: 5, hour: 19, minute: 30 },
        { weekday: 1, hour: 18, minute: 0 },
        { weekday: 1, hour: 7, minute: 15 },
      ]),
    ).toEqual([
      { weekday: 1, hour: 7, minute: 15 },
      { weekday: 5, hour: 19, minute: 30 },
    ]);
  });

  it('falls back to the shared hour when slots are missing', () => {
    expect(
      resolveReminderSlots({
        reminderWeekdays: [1, 3],
        reminderHour: 18,
        reminderMinute: 5,
      }),
    ).toEqual([
      { weekday: 1, hour: 18, minute: 5 },
      { weekday: 3, hour: 18, minute: 5 },
    ]);
  });

  it('keeps an explicit empty slot list', () => {
    expect(
      resolveReminderSlots({
        reminderSlots: [],
        reminderWeekdays: [1, 3],
        reminderHour: 18,
        reminderMinute: 5,
      }),
    ).toEqual([]);
  });
});
