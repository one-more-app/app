import { parseSegmentDaysParam } from './parse-segment-params.js';
import type { OutboundSegment } from './segment.types.js';

export const inactiveSinceSegment: OutboundSegment = {
  key: 'inactive_since',
  async resolveUserIds(_qb, ctx) {
    const days = parseSegmentDaysParam(ctx.params.days, 7, 'inactive_since');
    if (!Number.isFinite(days) || days < 1) {
      throw new Error('inactive_since: param days invalide');
    }

    const rows = await _qb.connection.query<Array<{ userId: string }>>(
      `
      SELECT u.id AS "userId"
      FROM users u
      WHERE u."deletedAt" IS NULL
        AND u.email IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM performance_entries p
          WHERE p."userId" = u.id
            AND p."deletedAt" IS NULL
            AND p.date >= (CURRENT_DATE - ($1::int - 1))
        )
    `,
      [days],
    );
    return rows.map((r) => r.userId);
  },
};
