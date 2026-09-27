import { buildAccountDeletionNotionPayload } from './build-account-deletion-notion-payload.js';

describe('buildAccountDeletionNotionPayload', () => {
  it('mappe Source Réglages et Type Suppression', () => {
    const payload = buildAccountDeletionNotionPayload(
      'db-id',
      'user-123',
      'athlete@example.com',
      { firstName: 'Vincent', lastName: 'Dupont' },
      'Le prix est trop élevé',
      'Backlog',
    );

    expect(payload.parent).toEqual({ database_id: 'db-id' });
    const props = payload.properties;
    expect(props.Name).toEqual({
      title: [{ text: { content: 'Suppression de compte' } }],
    });
    expect(props.Source).toEqual({ select: { name: 'Réglages' } });
    expect(props.Type).toEqual({ select: { name: 'Suppression' } });
    expect(props.Status).toEqual({ status: { name: 'Backlog' } });
    expect(props.Message).toEqual({
      rich_text: [
        { type: 'text', text: { content: 'Le prix est trop élevé' } },
      ],
    });
    expect(props.Email).toBeDefined();
    expect(props['User ID']).toBeDefined();
  });
});
