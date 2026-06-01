import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  getLeagueInfo,
  getLeagueLevelIndex,
  type LeagueInfo,
} from '../shared/strength-standards.js';
import {
  getPersonalBestFromEntries,
  isNewPersonalBest,
} from './lib/personal-best.js';
import { XP_AMOUNTS, XP_DAILY_CAPS } from './lib/xp-config.js';
import { levelProgressFromTotalXp } from './lib/xp-levels.js';
import {
  applyStreakExpiry,
  computeStreakAfterActivity as computeStreak,
} from './lib/streak-dates.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { XpEventEntity } from './entities/xp-event.entity.js';
import { UserProgressEntity } from './entities/user-progress.entity.js';
import { XpSourceType } from './entities/xp-source-type.enum.js';
import type { ActivityMonthDto } from './dto/activity-response.dto.js';
import type {
  ProgressStateDto,
  XpGrantResultDto,
} from './dto/progress-response.dto.js';
import {
  monthKeyFromDate,
  monthRangeBounds,
  parseMonthKey,
} from './lib/activity-month.js';

export type ProcessPerformanceParams = {
  userId: string;
  perfClientId: string;
  trackedExerciseClientId: string;
  activityDate: string;
  weight: number;
  reps: number;
};

@Injectable()
export class ProgressService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserProgressEntity)
    private readonly progressRepo: Repository<UserProgressEntity>,
    @InjectRepository(XpEventEntity)
    private readonly xpEventRepo: Repository<XpEventEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profileRepo: Repository<UserProfileEntity>,
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
  ) {}

  async getActivity(
    userId: string,
    monthParam?: string,
  ): Promise<ActivityMonthDto> {
    const latestMonth = monthKeyFromDate(new Date());
    let month = latestMonth;
    if (monthParam != null && monthParam !== '') {
      try {
        parseMonthKey(monthParam);
        month = monthParam;
      } catch {
        throw new BadRequestException('month must be YYYY-MM');
      }
    }

    const { start, end } = monthRangeBounds(month);
    const progress = await this.getOrCreateProgress(userId);

    const rows = await this.perfRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.date', 'date')
      .where('p.userId = :userId', { userId })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('p.date >= :start AND p.date <= :end', { start, end })
      .orderBy('p.date', 'ASC')
      .getRawMany<{ date: string }>();

    const activeDays = rows.map((r) => r.date);

    const boundsRow = await this.perfRepo
      .createQueryBuilder('p')
      .select('MIN(p.date)', 'minDate')
      .addSelect('MAX(p.date)', 'maxDate')
      .where('p.userId = :userId', { userId })
      .andWhere('p.deletedAt IS NULL')
      .getRawOne<{ minDate: string | null; maxDate: string | null }>();

    let earliestMonth = latestMonth;
    if (boundsRow?.minDate) {
      earliestMonth = boundsRow.minDate.slice(0, 7);
    }

    return {
      month,
      activeDays,
      activeDayCount: activeDays.length,
      streak: this.effectiveStreak(progress),
      bounds: {
        earliestMonth,
        latestMonth,
      },
    };
  }

  async getProgress(userId: string): Promise<ProgressStateDto> {
    const progress = await this.getOrCreateProgress(userId);
    const { level, xpIntoLevel, xpForNextLevel } = levelProgressFromTotalXp(
      progress.totalXp,
    );
    const recent = await this.xpEventRepo.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
      take: 5,
    });
    return {
      totalXp: progress.totalXp,
      level,
      xpIntoLevel,
      xpForNextLevel,
      streak: this.effectiveStreak(progress),
      lastActiveDate: progress.lastActiveDate,
      recentGrants: recent.map((e) => ({
        sourceType: e.sourceType,
        amount: e.amount,
      })),
    };
  }

  async processPerformanceAdded(
    params: ProcessPerformanceParams,
  ): Promise<XpGrantResultDto> {
    return this.dataSource.transaction(async (manager) => {
      const progressRepo = manager.getRepository(UserProgressEntity);
      const xpRepo = manager.getRepository(XpEventEntity);
      const profileRepo = manager.getRepository(UserProfileEntity);
      const perfRepo = manager.getRepository(PerformanceEntryEntity);
      const trackedRepo = manager.getRepository(TrackedExerciseEntity);

      const tracked = await trackedRepo.findOne({
        where: {
          userId: params.userId,
          clientId: params.trackedExerciseClientId,
        },
      });
      if (!tracked) {
        return this.emptyGrantResult(await this.getOrCreateProgressInRepo(
          progressRepo,
          params.userId,
        ));
      }

      const profile = await profileRepo.findOne({
        where: { userId: params.userId },
      });

      const activePerfs = await perfRepo.find({
        where: {
          userId: params.userId,
          trackedExerciseId: tracked.id,
          deletedAt: IsNull(),
        },
      });
      const prevPerfsExcludingCurrent = activePerfs.filter(
        (p) => p.clientId !== params.perfClientId,
      );
      const prevPB = getPersonalBestFromEntries(prevPerfsExcludingCurrent);
      const nextPB = getPersonalBestFromEntries(activePerfs);

      const progress = await this.getOrCreateProgressInRepo(
        progressRepo,
        params.userId,
      );
      const levelBefore = levelProgressFromTotalXp(progress.totalXp).level;
      const grants: { sourceType: string; amount: number }[] = [];

      const tryGrant = async (
        sourceType: XpSourceType,
        sourceId: string,
        amount: number,
        withinCap: () => Promise<boolean>,
      ) => {
        if (amount <= 0) return;
        if (!(await withinCap())) return;
        const inserted = await this.insertXpEvent(xpRepo, {
          userId: params.userId,
          sourceType,
          sourceId,
          amount,
          activityDate: params.activityDate,
        });
        if (inserted) {
          grants.push({ sourceType, amount });
          progress.totalXp += amount;
        }
      };

      await tryGrant(
        XpSourceType.Perf,
        `perf:${params.perfClientId}`,
        XP_AMOUNTS.perf,
        async () => {
          const count = await xpRepo.count({
            where: {
              userId: params.userId,
              sourceType: XpSourceType.Perf,
              activityDate: params.activityDate,
            },
          });
          return count < XP_DAILY_CAPS.perf;
        },
      );

      if (isNewPersonalBest(prevPB, nextPB)) {
        await tryGrant(
          XpSourceType.PersonalRecord,
          `pr:${params.trackedExerciseClientId}:${params.activityDate}`,
          XP_AMOUNTS.personalRecord,
          async () => {
            const count = await xpRepo.count({
              where: {
                userId: params.userId,
                sourceType: XpSourceType.PersonalRecord,
                activityDate: params.activityDate,
                sourceId: `pr:${params.trackedExerciseClientId}:${params.activityDate}`,
              },
            });
            return count < XP_DAILY_CAPS.personalRecordPerExercise;
          },
        );
      }

      const prevLeague = this.leagueFromPb(tracked, prevPB, profile);
      const nextLeague = this.leagueFromPb(tracked, nextPB, profile);
      if (this.didLeaguePromote(prevLeague, nextLeague) && nextLeague) {
        await tryGrant(
          XpSourceType.LeaguePromotion,
          `league:${params.trackedExerciseClientId}:${nextLeague.level}`,
          XP_AMOUNTS.leaguePromotion,
          async () => {
            const count = await xpRepo.count({
              where: {
                userId: params.userId,
                sourceType: XpSourceType.LeaguePromotion,
                activityDate: params.activityDate,
              },
            });
            return count < XP_DAILY_CAPS.leaguePromotion;
          },
        );
      }

      const hadPerfToday = await perfRepo
        .createQueryBuilder('p')
        .where('p.userId = :userId', { userId: params.userId })
        .andWhere('p.date = :activityDate', {
          activityDate: params.activityDate,
        })
        .andWhere('p.deletedAt IS NULL')
        .andWhere('p.clientId != :perfClientId', {
          perfClientId: params.perfClientId,
        })
        .getCount();

      if (hadPerfToday === 0) {
        const streakAfter = computeStreak(
          progress.lastActiveDate,
          progress.currentStreak,
          params.activityDate,
        );
        progress.currentStreak = streakAfter.current;
        progress.longestStreak = Math.max(
          progress.longestStreak,
          streakAfter.current,
        );
        progress.lastActiveDate = params.activityDate;

        const streakBonus =
          streakAfter.current >= 2
            ? XP_AMOUNTS.dailyStreakPerDay *
              Math.min(streakAfter.current, XP_AMOUNTS.dailyStreakCap)
            : 0;
        const streakAmount = XP_AMOUNTS.dailyStreakBase + streakBonus;

        await tryGrant(
          XpSourceType.DailyStreak,
          `streak:${params.activityDate}`,
          streakAmount,
          async () => {
            const count = await xpRepo.count({
              where: {
                userId: params.userId,
                sourceType: XpSourceType.DailyStreak,
                activityDate: params.activityDate,
              },
            });
            return count < XP_DAILY_CAPS.dailyStreak;
          },
        );
      }

      await progressRepo.save(progress);

      const { level, xpIntoLevel, xpForNextLevel } = levelProgressFromTotalXp(
        progress.totalXp,
      );

      return {
        totalXp: progress.totalXp,
        level,
        xpIntoLevel,
        xpForNextLevel,
        leveledUp: level > levelBefore,
        previousLevel: level > levelBefore ? levelBefore : undefined,
        grants,
        streak: this.effectiveStreak(progress),
      };
    });
  }

  private effectiveStreak(progress: UserProgressEntity): {
    current: number;
    longest: number;
  } {
    return {
      current: applyStreakExpiry(
        progress.lastActiveDate,
        progress.currentStreak,
      ),
      longest: progress.longestStreak,
    };
  }

  private async getOrCreateProgress(userId: string): Promise<UserProgressEntity> {
    return this.getOrCreateProgressInRepo(this.progressRepo, userId);
  }

  private async getOrCreateProgressInRepo(
    repo: Repository<UserProgressEntity>,
    userId: string,
  ): Promise<UserProgressEntity> {
    let progress = await repo.findOne({ where: { userId } });
    if (!progress) {
      progress = repo.create({
        userId,
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      });
      progress = await repo.save(progress);
    }
    return progress;
  }

  private async insertXpEvent(
    repo: Repository<XpEventEntity>,
    event: {
      userId: string;
      sourceType: XpSourceType;
      sourceId: string;
      amount: number;
      activityDate: string;
    },
  ): Promise<boolean> {
    const existing = await repo.findOne({
      where: {
        userId: event.userId,
        sourceType: event.sourceType,
        sourceId: event.sourceId,
      },
    });
    if (existing) return false;
    try {
      await repo.save(repo.create(event));
      return true;
    } catch {
      return false;
    }
  }

  private leagueFromPb(
    tracked: TrackedExerciseEntity,
    pb: { weight: number; reps: number } | null,
    profile: UserProfileEntity | null,
  ): LeagueInfo | null {
    if (!pb || tracked.isCustom || !profile?.weightKg || !profile.gender) {
      return null;
    }
    const gender =
      profile.gender === 'female' ? ('female' as const) : ('male' as const);
    return getLeagueInfo({
      weight: pb.weight,
      reps: pb.reps,
      bodyWeightKg: profile.weightKg,
      gender,
      exerciseName: tracked.name,
      exerciseMetadata: {
        equipment: tracked.equipment ?? undefined,
        target: tracked.target ?? undefined,
      },
    });
  }

  private didLeaguePromote(
    prev: LeagueInfo | null,
    next: LeagueInfo | null,
  ): boolean {
    if (!next) return false;
    if (!prev) return true;
    return getLeagueLevelIndex(next.level) > getLeagueLevelIndex(prev.level);
  }

  private emptyGrantResult(progress: UserProgressEntity): XpGrantResultDto {
    const { level, xpIntoLevel, xpForNextLevel } = levelProgressFromTotalXp(
      progress.totalXp,
    );
    return {
      totalXp: progress.totalXp,
      level,
      xpIntoLevel,
      xpForNextLevel,
      leveledUp: false,
      grants: [],
      streak: this.effectiveStreak(progress),
    };
  }
}
