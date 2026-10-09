import { parseSegmentDelayParams } from './parse-segment-params.js';
import type { OutboundSegment } from './segment.types.js';

export const registeredNoPushSegment: OutboundSegment = {
  key: 'registered_no_push',
  async resolveUserIds(_qb, ctx) {
    const { totalHours, maxTotalHours } = parseSegmentDelayParams(
      ctx.params,
      'registered_no_push',
    );

    const rows = await _qb.connection.query<Array<{ userId: string }>>(
      `
      SELECT u.id AS "userId"
      FROM users u
      WHERE u."deletedAt" IS NULL
        AND u.email IS NOT NULL
        AND btrim(u.email) <> ''
        AND u."createdAt" <= NOW() - ($1::int * INTERVAL '1 hour')
        AND ($2::int IS NULL OR u."createdAt" > NOW() - ($2::int * INTERVAL '1 hour'))
        AND NOT EXISTS (
          SELECT 1 FROM device_tokens dt WHERE dt."userId" = u.id
        )
    `,
      [totalHours, maxTotalHours],
    );
    return rows.map((r) => r.userId);
  },
};
