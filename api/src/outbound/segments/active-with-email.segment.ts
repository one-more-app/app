import type { OutboundSegment } from './segment.types.js';

export const activeWithEmailSegment: OutboundSegment = {
  key: 'active_with_email',
  async resolveUserIds(_qb) {
    const rows = await _qb.connection.query<Array<{ userId: string }>>(
      `
      SELECT u.id AS "userId"
      FROM users u
      WHERE u."deletedAt" IS NULL
        AND u.email IS NOT NULL
        AND btrim(u.email) <> ''
    `,
    );
    return rows.map((r) => r.userId);
  },
};
