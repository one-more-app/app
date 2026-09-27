import { buildReviewSchemaPatch } from './notion-review-schema-sync.js';

describe('buildReviewSchemaPatch', () => {
  it('ajoute les options manquantes sans supprimer les existantes', () => {
    const patch = buildReviewSchemaPatch(
      {
        Platform: {
          type: 'select',
          select: { options: [{ id: 'p1', name: 'ios', color: 'blue' }] },
        },
        Chips: {
          type: 'multi_select',
          multi_select: { options: [{ name: 'Un bug', color: 'red' }] },
        },
        Status: {
          type: 'status',
          status: { options: [{ id: 's1', name: 'À faire', color: 'gray' }] },
        },
      },
      'Backlog',
    );

    expect(patch.Platform).toEqual({
      select: {
        options: [
          { id: 'p1', name: 'ios', color: 'blue' },
          { name: 'android', color: 'default' },
          { name: 'web', color: 'default' },
        ],
      },
    });
    expect(
      (patch.Chips as { multi_select: { options: { name: string }[] } })
        .multi_select.options.length,
    ).toBeGreaterThan(1);
    expect(patch.Status).toEqual({
      status: {
        options: [
          { id: 's1', name: 'À faire', color: 'gray' },
          { name: 'Backlog', color: 'default' },
        ],
      },
    });
  });
});
