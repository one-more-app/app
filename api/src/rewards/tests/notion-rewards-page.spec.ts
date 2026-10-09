import {
  notionIdsEqual,
  parseRewardsNotionPage,
} from '../lib/notion-rewards-page.js';

describe('notion-rewards-page', () => {
  it('parses Statut and Claim ID from a Notion page payload', () => {
    const parsed = parseRewardsNotionPage('page-1', {
      id: 'page-1',
      parent: { type: 'database_id', database_id: 'db-abc' },
      properties: {
        Statut: { type: 'status', status: { name: 'Expédié' } },
        'Claim ID': {
          type: 'rich_text',
          rich_text: [{ plain_text: 'claim-uuid' }],
        },
      },
    });
    expect(parsed).toEqual({
      pageId: 'page-1',
      databaseId: 'db-abc',
      statusName: 'Expédié',
      claimId: 'claim-uuid',
    });
  });

  it('compares Notion ids ignoring dashes and case', () => {
    expect(
      notionIdsEqual(
        '3e8351dd-cd21-80a7-9c3f-dd8b9927ce32',
        '3e8351ddcd2180a79c3fdd8b9927ce32',
      ),
    ).toBe(true);
  });
});
