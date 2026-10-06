import type { OutboundSegment } from './segment.types.js';
import { isStreakAtRisk } from '../../progress/lib/streak-dates.js';

export const streakAtRiskSegment: OutboundSegment = {
  key: 'streak_at_risk',
  async resolveUserIds(_qb, ctx) {
    const timezone =
      typeof ctx.params.timezone === 'string' ? ctx.params.timezone : null;
    if (!timezone?.trim()) {
      throw new Error('streak_at_risk: param timezone requis');
    }

    const todayRows = await _qb.connection.query<Array<{ today: string }>>(
      `SELECT to_char((NOW() AT TIME ZONE $1)::date, 'YYYY-MM-DD') AS today`,
      [timezone],
    );
    const today = todayRows[0]?.today;
    if (!today) return [];

    const rows = await _qb.connection.query<
      Array<{ userId: string; lastActiveDate: string; currentStreak: number }>
    >(
      `
      SELECT DISTINCT dt."userId" AS "userId",
        up."lastActiveDate" AS "lastActiveDate",
        up."currentStreak" AS "currentStreak"
      FROM device_tokens dt
      INNER JOIN user_progress up ON up."userId" = dt."userId"
      INNER JOIN users u ON u.id = dt."userId"
      WHERE dt.timezone = $1
        AND u."deletedAt" IS NULL
        AND up."currentStreak" > 0
        AND up."lastActiveDate" IS NOT NULL
    `,
      [timezone],
    );

    const eligible: string[] = [];
    for (const row of rows) {
      if (!isStreakAtRisk(row.lastActiveDate, row.currentStreak, today)) {
        continue;
      }
      const perf = await _qb.connection.query<Array<{ count: string }>>(
        `
        SELECT COUNT(*)::text AS count
        FROM performance_entries p
        WHERE p."userId" = $1
          AND p.date = $2
          AND p."deletedAt" IS NULL
      `,
        [row.userId, today],
      );
      if (Number.parseInt(perf[0]?.count ?? '0', 10) > 0) continue;
      eligible.push(row.userId);
    }
    return eligible;
  },
};
