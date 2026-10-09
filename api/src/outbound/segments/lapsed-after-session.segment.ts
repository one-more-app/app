import { parseSegmentDelayParams } from './parse-segment-params.js';
import { SQL_HAS_REAL_SESSION, SQL_LAST_APP_ACTIVITY } from './segment-sql.js';
import type { OutboundSegment } from './segment.types.js';

export const lapsedAfterSessionSegment: OutboundSegment = {
  key: 'lapsed_after_session',
  async resolveUserIds(_qb, ctx) {
    const { totalHours, maxTotalHours } = parseSegmentDelayParams(
      ctx.params,
      'lapsed_after_session',
    );

    const rows = await _qb.connection.query<Array<{ userId: string }>>(
      `
      SELECT u.id AS "userId"
      FROM users u
      WHERE u."deletedAt" IS NULL
        AND u.email IS NOT NULL
        AND btrim(u.email) <> ''
        AND ${SQL_HAS_REAL_SESSION}
        AND ${SQL_LAST_APP_ACTIVITY} <= NOW() - ($1::int * INTERVAL '1 hour')
        AND (
          $2::int IS NULL
          OR ${SQL_LAST_APP_ACTIVITY} > NOW() - ($2::int * INTERVAL '1 hour')
        )
    `,
      [totalHours, maxTotalHours],
    );
    return rows.map((r) => r.userId);
  },
};
