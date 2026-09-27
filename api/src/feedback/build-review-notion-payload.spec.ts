import { buildReviewNotionPayload } from './build-review-notion-payload.js';

describe('buildReviewNotionPayload', () => {
  it('mappe Type Feedback, chips multi_select et contact', () => {
    const payload = buildReviewNotionPayload(
      'db-id',
      'user-123',
      'athlete@example.com',
      { firstName: 'Vincent', lastName: 'Dupont' },
      {
        chips: ['missing_exercise', 'bug'],
        message: 'Bench manquant',
        appVersion: '1.2.3',
        platform: 'ios',
        locale: 'fr',
        sessionsCount: 12,
        createdAt: '2026-06-15T10:00:00.000Z',
        sessionId: '2026-06-15',
        deviceModel: 'iPhone',
        osVersion: '18.0',
      },
      'Backlog',
    );

    expect(payload.parent).toEqual({ database_id: 'db-id' });
    const props = payload.properties;
    expect(props.Type).toEqual({ select: { name: 'Review' } });
    expect(props.Source).toEqual({ select: { name: 'Review pulse' } });
    expect(props.Status).toEqual({ status: { name: 'Backlog' } });
    expect(props.Chips).toEqual({
      multi_select: [{ name: 'Il manque un exercice' }, { name: 'Un bug' }],
    });
    expect(props.Email).toBeDefined();
    expect(props['User ID']).toBeDefined();
    expect(props.Message).toBeDefined();
    expect(props.Sessions).toEqual({ number: 12 });
    expect(props.Date).toEqual({ date: { start: '2026-06-15' } });
  });
});
