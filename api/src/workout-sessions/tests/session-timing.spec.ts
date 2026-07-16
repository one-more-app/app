import {
  computeSessionTiming,
  formatSessionDuration,
  formatSessionTimingLabel,
  getSessionBounds,
  SESSION_ACTIVE_IDLE_MS,
} from '../../shared/session-timing.js';

const TODAY = '2026-07-13';
const NOW = new Date('2026-07-13T14:00:00Z').getTime();

function entry(createdAt: string) {
  return { createdAt };
}

describe('session-timing', () => {
  it('getSessionBounds trie par createdAt', () => {
    const bounds = getSessionBounds([
      entry('2026-07-13T12:30:00Z'),
      entry('2026-07-13T10:00:00Z'),
      entry('2026-07-13T11:00:00Z'),
    ]);
    expect(bounds?.first.createdAt).toBe('2026-07-13T10:00:00Z');
    expect(bounds?.last.createdAt).toBe('2026-07-13T12:30:00Z');
  });

  it('séance terminée sur un jour passé', () => {
    const timing = computeSessionTiming(
      [entry('2026-07-06T10:00:00Z'), entry('2026-07-06T11:30:00Z')],
      { now: NOW, dayKey: '2026-07-06', todayKey: TODAY },
    );
    expect(timing?.isInProgress).toBe(false);
    expect(timing?.durationMs).toBe(90 * 60 * 1000);
    expect(formatSessionTimingLabel(timing!)).toBe('1 h 30');
  });

  it('séance en cours si idle < 25 min aujourd hui', () => {
    const last = new Date(NOW - 10 * 60 * 1000).toISOString();
    const first = new Date(NOW - 40 * 60 * 1000).toISOString();
    const timing = computeSessionTiming([entry(first), entry(last)], {
      now: NOW,
      dayKey: TODAY,
      todayKey: TODAY,
    });
    expect(timing?.isInProgress).toBe(true);
    expect(timing?.durationMs).toBe(40 * 60 * 1000);
    expect(formatSessionTimingLabel(timing!)).toBe('En cours · 40 min');
  });

  it('séance terminée si idle >= 25 min aujourd hui', () => {
    const last = new Date(NOW - SESSION_ACTIVE_IDLE_MS).toISOString();
    const first = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();
    const timing = computeSessionTiming([entry(first), entry(last)], {
      now: NOW,
      dayKey: TODAY,
      todayKey: TODAY,
    });
    expect(timing?.isInProgress).toBe(false);
    expect(timing?.durationMs).toBe(
      new Date(last).getTime() - new Date(first).getTime(),
    );
  });

  it('présence training garde la séance en cours malgré l idle', () => {
    const last = new Date(NOW - SESSION_ACTIVE_IDLE_MS - 60_000).toISOString();
    const first = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();
    const timing = computeSessionTiming([entry(first), entry(last)], {
      now: NOW,
      dayKey: TODAY,
      todayKey: TODAY,
      isPresenceTraining: true,
    });
    expect(timing?.isInProgress).toBe(true);
  });

  it('une seule série affiche au moins 1 min', () => {
    const timing = computeSessionTiming([entry('2026-07-06T10:00:00Z')], {
      now: NOW,
      dayKey: '2026-07-06',
      todayKey: TODAY,
    });
    expect(formatSessionDuration(timing!.durationMs)).toBe('1 min');
  });

  it('formatSessionDuration heures sans minutes à zéro', () => {
    expect(formatSessionDuration(60 * 60 * 1000)).toBe('1 h');
    expect(formatSessionDuration(65 * 60 * 1000)).toBe('1 h 05');
    expect(formatSessionDuration(45 * 60 * 1000)).toBe('45 min');
  });
});
