import { describe, expect, it } from "vitest";
import {
  clampReminderHour,
  clampReminderMinute,
  formatReminderSchedule,
  formatReminderTime,
  normalizeReminderSlots,
  setReminderSlotTime,
  toggleReminderSlot,
} from "./reminder-schedule";

describe("reminder-schedule", () => {
  it("normalise les créneaux par jour ISO", () => {
    expect(
      normalizeReminderSlots([
        { weekday: 5, hour: 19, minute: 30 },
        { weekday: 1, hour: 18, minute: 0 },
        { weekday: 1, hour: 7, minute: 15 },
        { weekday: 8, hour: 12, minute: 0 },
      ]),
    ).toEqual([
      { weekday: 1, hour: 7, minute: 15 },
      { weekday: 5, hour: 19, minute: 30 },
    ]);
  });

  it("ajoute ou retire un jour en héritant de l'heure courante", () => {
    expect(
      toggleReminderSlot(
        [{ weekday: 1, hour: 18, minute: 0 }],
        3,
        { weekday: 1, hour: 18, minute: 0 },
      ),
    ).toEqual([
      { weekday: 1, hour: 18, minute: 0 },
      { weekday: 3, hour: 18, minute: 0 },
    ]);
    expect(
      toggleReminderSlot(
        [
          { weekday: 1, hour: 18, minute: 0 },
          { weekday: 3, hour: 19, minute: 30 },
        ],
        3,
      ),
    ).toEqual([{ weekday: 1, hour: 18, minute: 0 }]);
  });

  it("change l'heure d'un seul jour", () => {
    expect(
      setReminderSlotTime(
        [
          { weekday: 1, hour: 18, minute: 0 },
          { weekday: 5, hour: 18, minute: 0 },
        ],
        5,
        7,
        15,
      ),
    ).toEqual([
      { weekday: 1, hour: 18, minute: 0 },
      { weekday: 5, hour: 7, minute: 15 },
    ]);
  });

  it("formate l'heure exacte et borne la plage", () => {
    expect(formatReminderTime(18)).toBe("18h00");
    expect(formatReminderTime(18, 5)).toBe("18h05");
    expect(clampReminderHour(-1)).toBe(0);
    expect(clampReminderHour(3)).toBe(3);
    expect(clampReminderHour(23)).toBe(23);
    expect(clampReminderHour(99)).toBe(23);
    expect(clampReminderMinute(-4)).toBe(0);
    expect(clampReminderMinute(5)).toBe(5);
    expect(clampReminderMinute(59)).toBe(59);
    expect(clampReminderMinute(80)).toBe(59);
  });

  it("résume le planning en français", () => {
    expect(
      formatReminderSchedule([
        { weekday: 1, hour: 18, minute: 0 },
        { weekday: 3, hour: 18, minute: 0 },
        { weekday: 5, hour: 18, minute: 0 },
      ]),
    ).toBe("Tous les lundi, mercredi et vendredi à 18h00");
    expect(
      formatReminderSchedule(
        [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
          weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
          hour: 7,
          minute: 30,
        })),
      ),
    ).toBe("Tous les jours à 7h30");
    expect(
      formatReminderSchedule([
        { weekday: 1, hour: 8, minute: 0 },
      ]),
    ).toBe("Tous les lundis à 8h00");
    expect(
      formatReminderSchedule([
        { weekday: 1, hour: 18, minute: 0 },
        { weekday: 3, hour: 19, minute: 30 },
      ]),
    ).toBe("Lun 18h00 · Mer 19h30");
  });
});
