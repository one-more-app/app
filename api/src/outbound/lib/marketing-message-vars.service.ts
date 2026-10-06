import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceEntryEntity } from '../../performance/performance-entry.entity.js';
import { UserProgressEntity } from '../../progress/entities/user-progress.entity.js';
import { XpEventEntity } from '../../progress/entities/xp-event.entity.js';
import {
  applyStreakExpiry,
  isStreakAtRisk,
} from '../../progress/lib/streak-dates.js';
import {
  formatFrenchMonthLabel,
  localDateKey,
  localWeekKey,
  previousLocalMonthKey,
} from '../../notifications/lib/timezone.js';

@Injectable()
export class MarketingMessageVarsService {
  constructor(
    @InjectRepository(UserProgressEntity)
    private readonly progressRepo: Repository<UserProgressEntity>,
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
    @InjectRepository(XpEventEntity)
    private readonly xpRepo: Repository<XpEventEntity>,
  ) {}

  async weeklyRecapVariables(
    userId: string,
    timezone: string,
  ): Promise<Record<string, string | number>> {
    const today = localDateKey(timezone);
    const weekKey = localWeekKey(timezone);
    const weekStart = new Date(`${today}T12:00:00Z`);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const startDate = localDateKey(timezone, weekStart);

    const sessions = await this.perfRepo
      .createQueryBuilder('p')
      .select('COUNT(DISTINCT p.date)', 'count')
      .where('p.userId = :userId', { userId })
      .andWhere('p.date >= :startDate', { startDate })
      .andWhere('p.date <= :today', { today })
      .andWhere('p.deletedAt IS NULL')
      .getRawOne<{ count: string }>();

    const xpRow = await this.xpRepo
      .createQueryBuilder('x')
      .select('COALESCE(SUM(x.amount), 0)', 'total')
      .where('x.userId = :userId', { userId })
      .andWhere('x.activityDate >= :startDate', { startDate })
      .andWhere('x.activityDate <= :today', { today })
      .getRawOne<{ total: string }>();

    const progress = await this.progressRepo.findOne({ where: { userId } });
    const streak =
      progress && progress.lastActiveDate
        ? applyStreakExpiry(
            progress.lastActiveDate,
            progress.currentStreak,
            today,
          )
        : 0;

    const sessionCount = Number.parseInt(sessions?.count ?? '0', 10);
    const xpTotal = Number.parseInt(xpRow?.total ?? '0', 10);

    return {
      sessionCount,
      xpTotal,
      streak,
      weekKey,
      sessionLabel: sessionCount > 1 ? 'séances' : 'séance',
    };
  }

  async monthlyRankingRecapVariables(
    userId: string,
    timezone: string,
  ): Promise<Record<string, string | number> | null> {
    const month = previousLocalMonthKey(timezone);
    const [y, m] = month.split('-').map(Number);
    const start = `${month}-01`;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const end = `${month}-${String(lastDay).padStart(2, '0')}`;

    const xpRow = await this.xpRepo
      .createQueryBuilder('x')
      .select('COALESCE(SUM(x.amount), 0)', 'total')
      .where('x.userId = :userId', { userId })
      .andWhere('x.activityDate >= :start', { start })
      .andWhere('x.activityDate <= :end', { end })
      .getRawOne<{ total: string }>();

    const xpTotal = Number.parseInt(xpRow?.total ?? '0', 10);
    if (xpTotal <= 0) return null;

    const monthLabel = formatFrenchMonthLabel(month);
    return { xpTotal, month, monthLabel };
  }

  async streakAtRiskVariables(
    userId: string,
    timezone: string,
  ): Promise<Record<string, string | number> | null> {
    const today = localDateKey(timezone);
    const progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress || progress.currentStreak <= 0 || !progress.lastActiveDate) {
      return null;
    }
    if (
      !isStreakAtRisk(progress.lastActiveDate, progress.currentStreak, today)
    ) {
      return null;
    }

    const hadPerfToday = await this.perfRepo
      .createQueryBuilder('p')
      .where('p.userId = :userId', { userId })
      .andWhere('p.date = :today', { today })
      .andWhere('p.deletedAt IS NULL')
      .getCount();
    if (hadPerfToday > 0) return null;

    const streak = applyStreakExpiry(
      progress.lastActiveDate,
      progress.currentStreak,
      today,
    );
    return { streak, today };
  }

  async trainingReminderEligible(
    userId: string,
    timezone: string,
  ): Promise<Record<string, string | number> | null> {
    const today = localDateKey(timezone);
    const hadPerfToday = await this.perfRepo
      .createQueryBuilder('p')
      .where('p.userId = :userId', { userId })
      .andWhere('p.date = :today', { today })
      .andWhere('p.deletedAt IS NULL')
      .getCount();
    if (hadPerfToday > 0) return null;
    return { today };
  }
}
