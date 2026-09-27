import { describe, expect, it } from '@jest/globals';
import { buildRewardsSchemaPatch } from '../lib/notion-rewards-schema-sync.js';

describe('buildRewardsSchemaPatch', () => {
  it('adds missing status and select options', () => {
    const patch = buildRewardsSchemaPatch(
      {
        Type: {
          type: 'select',
          select: { options: [{ name: 'Parrainage' }] },
        },
        Taille: {
          type: 'select',
          select: { options: [{ name: 'M' }] },
        },
        Statut: {
          type: 'status',
          status: { options: [{ name: 'Pas commencé' }] },
        },
      },
      'À traiter',
    );

    expect(patch.Type).toBeDefined();
    expect(patch.Taille).toBeDefined();
    expect(patch.Statut).toBeDefined();
  });

  it('returns empty patch when all options exist', () => {
    const patch = buildRewardsSchemaPatch(
      {
        Type: {
          type: 'select',
          select: {
            options: [{ name: 'Parrainage' }, { name: 'Pack annuel' }],
          },
        },
        Taille: {
          type: 'select',
          select: {
            options: [
              { name: 'XS' },
              { name: 'S' },
              { name: 'M' },
              { name: 'L' },
              { name: 'XL' },
              { name: 'XXL' },
            ],
          },
        },
        Statut: {
          type: 'status',
          status: {
            options: [
              { name: 'À traiter' },
              { name: 'Expédié' },
              { name: 'Livré' },
            ],
          },
        },
      },
      'À traiter',
    );

    expect(patch).toEqual({});
  });
});
