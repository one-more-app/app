import { parseSegmentDaysParam } from './parse-segment-params.js';
import type { OutboundSegment } from './segment.types.js';

export const signedUpDaysAgoSegment: OutboundSegment = {
  key: 'signed_up_days_ago',
  async resolveUserIds(_qb, ctx) {
    const timezone =
      typeof ctx.params.timezone === 'string' ? ctx.params.timezone : null;
    const days = parseSegmentDaysParam(
      ctx.params.days,
      1,
      'signed_up_days_ago',
    );
    if (!Number.isFinite(days) || days < 0) {
      throw new Error('signed_up_days_ago: param days invalide');
    }
    if (!timezone?.trim()) {
      throw new Error('signed_up_days_ago: param timezone requis');
    }

    const rows = await _qb.connection.query<Array<{ userId: string }>>(
      `
      SELECT DISTINCT dt."userId" AS "userId"
      FROM device_tokens dt
      INNER JOIN users u ON u.id = dt."userId"
      WHERE dt.timezone = $1
        AND u."deletedAt" IS NULL
        AND u.email IS NOT NULL
        AND (u."createdAt" AT TIME ZONE $1)::date =
            ((NOW() AT TIME ZONE $1)::date - $2::int)
    `,
      [timezone, days],
    );
    return rows.map((r) => r.userId);
  },
};
