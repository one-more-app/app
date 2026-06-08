import { randomUUID } from 'node:crypto';
import { IsNull, type EntityManager, type Repository } from 'typeorm';
import {
  didRankPromote as ranksDidPromote,
  leagueFromTrackedExercise,
  type LeagueProfileInput,
} from '../../shared/league-aggregate.js';
import type { LeagueInfo } from '../../shared/strength-standards.js';
import { PerformanceEntryEntity } from '../../performance/performance-entry.entity.js';
import { TrackedExerciseEntity } from '../../tracked-exercises/tracked-exercise.entity.js';
import { UserProfileEntity } from '../../profile/user-profile.entity.js';
import {
  getPersonalBestFromEntries,
  isNewPersonalBest,
} from './personal-best.js';
import { XP_AMOUNTS, XP_DAILY_CAPS } from './xp-config.js';
import {
  applyStreakExpiry,
  computeStreakAfterActivity as computeStreak,
} from './streak-dates.js';
import { applyStreakXpMultiplier } from './streak-xp-multiplier.js';
import { XpEventEntity } from '../entities/xp-event.entity.js';
import { UserProgressEntity } from '../entities/user-progress.entity.js';
import { XpSourceType } from '../entities/xp-source-type.enum.js';

export type ReplayUserProgressResult = {
  userId: string;
  totalXp: number;
  eventCount: number;
  /** Comme `ProgressService.effectiveStreak` — ce que l'app affiche. */
  streak: { current: number; longest: number };
  lastActiveDate: string | null;
  performanceCount: number;
};

type ReplayContext = {
  manager: EntityManager;
  userId: string;
  profile: LeagueProfileInput | null;
  trackedById: Map<string, TrackedExerciseEntity>;
  progress: UserProgressEntity;
  xpEvents: XpEventEntity[];
  perfCountByDay: Map<string, number>;
  leagueCountByDay: Map<string, number>;
  dailyStreakByDay: Set<string>;
  prSourceIds: Set<string>;
  perfsByTrackedId: Map<string, PerformanceEntryEntity[]>;
  activeDates: Set<string>;
};

function leagueFromTracked(
  tracked: TrackedExerciseEntity,
  pb: { weight: number; reps: number } | null,
  profile: LeagueProfileInput | null,
): LeagueInfo | null {
  if (!profile) return null;
  return leagueFromTrackedExercise(
    {
      id: tracked.clientId,
      name: tracked.name,
      originalName: tracked.originalName,
      bodyPart: tracked.bodyPart,
      target: tracked.target,
      equipment: tracked.equipment,
      isCustom: tracked.isCustom,
      personalBest: pb,
    },
    profile,
  );
}

function tryGrant(
  ctx: ReplayContext,
  sourceType: XpSourceType,
  sourceId: string,
  amount: number,
  activityDate: string,
  withinCap: () => boolean,
): boolean {
  if (amount <= 0 || !withinCap()) return false;

  const duplicate = ctx.xpEvents.some(
    (e) =>
      e.sourceType === sourceType &&
      e.sourceId === sourceId &&
      e.userId === ctx.userId,
  );
  if (duplicate) return false;

  ctx.xpEvents.push({
    id: randomUUID(),
    userId: ctx.userId,
    sourceType,
    sourceId,
    amount,
    activityDate,
    earnedAt: new Date(),
  } as XpEventEntity);
  ctx.progress.totalXp += amount;
  return true;
}

function processPerformance(ctx: ReplayContext, perf: PerformanceEntryEntity): void {
  const tracked = ctx.trackedById.get(perf.trackedExerciseId);
  if (!tracked) return;

  const prevPerfs = ctx.perfsByTrackedId.get(tracked.id) ?? [];
  const prevPB = getPersonalBestFromEntries(prevPerfs);
  const nextPB = getPersonalBestFromEntries([...prevPerfs, perf]);

  const hadPerfToday = ctx.activeDates.has(perf.date);

  if (!hadPerfToday) {
    const streakAfter = computeStreak(
      ctx.progress.lastActiveDate,
      ctx.progress.currentStreak,
      perf.date,
    );
    ctx.progress.currentStreak = streakAfter.current;
    ctx.progress.longestStreak = Math.max(
      ctx.progress.longestStreak,
      streakAfter.current,
    );
    ctx.progress.lastActiveDate = perf.date;
  }

  const streakForMultiplier = ctx.progress.currentStreak;

  if (
    tryGrant(
      ctx,
      XpSourceType.Perf,
      `perf:${perf.clientId}`,
      applyStreakXpMultiplier(XP_AMOUNTS.perf, streakForMultiplier),
      perf.date,
      () => (ctx.perfCountByDay.get(perf.date) ?? 0) < XP_DAILY_CAPS.perf,
    )
  ) {
    ctx.perfCountByDay.set(
      perf.date,
      (ctx.perfCountByDay.get(perf.date) ?? 0) + 1,
    );
  }

  if (isNewPersonalBest(prevPB, nextPB)) {
    const prSourceId = `pr:${tracked.clientId}:${perf.date}`;
    if (
      tryGrant(
        ctx,
        XpSourceType.PersonalRecord,
        prSourceId,
        applyStreakXpMultiplier(XP_AMOUNTS.personalRecord, streakForMultiplier),
        perf.date,
        () => !ctx.prSourceIds.has(prSourceId),
      )
    ) {
      ctx.prSourceIds.add(prSourceId);
    }
  }

  const beforeLeague = leagueFromTracked(tracked, prevPB, ctx.profile);
  const afterLeague = leagueFromTracked(tracked, nextPB, ctx.profile);
  if (
    ranksDidPromote(beforeLeague, afterLeague) &&
    afterLeague?.rankId
  ) {
    if (
      tryGrant(
        ctx,
        XpSourceType.LeaguePromotion,
        `league:${tracked.clientId}:${afterLeague.rankId}`,
        XP_AMOUNTS.leaguePromotion,
        perf.date,
        () =>
          (ctx.leagueCountByDay.get(perf.date) ?? 0) <
          XP_DAILY_CAPS.leaguePromotion,
      )
    ) {
      ctx.leagueCountByDay.set(
        perf.date,
        (ctx.leagueCountByDay.get(perf.date) ?? 0) + 1,
      );
    }
  }

  if (!hadPerfToday) {
    const streakBonus =
      ctx.progress.currentStreak >= 2
        ? XP_AMOUNTS.dailyStreakPerDay *
          Math.min(ctx.progress.currentStreak, XP_AMOUNTS.dailyStreakCap)
        : 0;
    const streakAmount = XP_AMOUNTS.dailyStreakBase + streakBonus;

    if (
      tryGrant(
        ctx,
        XpSourceType.DailyStreak,
        `streak:${perf.date}`,
        streakAmount,
        perf.date,
        () => !ctx.dailyStreakByDay.has(perf.date),
      )
    ) {
      ctx.dailyStreakByDay.add(perf.date);
    }
  }

  const nextPerfs = [...prevPerfs, perf];
  ctx.perfsByTrackedId.set(tracked.id, nextPerfs);
  ctx.activeDates.add(perf.date);
}

async function loadProfileInput(
  profileRepo: Repository<UserProfileEntity>,
  userId: string,
): Promise<LeagueProfileInput | null> {
  const profile = await profileRepo.findOne({ where: { userId } });
  if (!profile?.weightKg) return null;
  return {
    weightKg: profile.weightKg,
    gender: profile.gender === 'female' ? 'female' : 'male',
  };
}

export async function replayUserProgress(
  manager: EntityManager,
  userId: string,
): Promise<ReplayUserProgressResult> {
  const progressRepo = manager.getRepository(UserProgressEntity);
  const xpRepo = manager.getRepository(XpEventEntity);
  const perfRepo = manager.getRepository(PerformanceEntryEntity);
  const trackedRepo = manager.getRepository(TrackedExerciseEntity);
  const profileRepo = manager.getRepository(UserProfileEntity);

  const profile = await loadProfileInput(profileRepo, userId);

  const trackedRows = await trackedRepo.find({
    where: { userId, deletedAt: IsNull() },
  });
  const trackedById = new Map(trackedRows.map((t) => [t.id, t]));

  const performances = await perfRepo.find({
    where: { userId, deletedAt: IsNull() },
    order: { date: 'ASC', updatedAt: 'ASC', id: 'ASC' },
  });

  await xpRepo.delete({ userId });

  let progress = await progressRepo.findOne({ where: { userId } });
  if (!progress) {
    progress = progressRepo.create({
      userId,
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    });
  } else {
    progress.totalXp = 0;
    progress.currentStreak = 0;
    progress.longestStreak = 0;
    progress.lastActiveDate = null;
  }

  const ctx: ReplayContext = {
    manager,
    userId,
    profile,
    trackedById,
    progress,
    xpEvents: [],
    perfCountByDay: new Map(),
    leagueCountByDay: new Map(),
    dailyStreakByDay: new Set(),
    prSourceIds: new Set(),
    perfsByTrackedId: new Map(),
    activeDates: new Set(),
  };

  for (const perf of performances) {
    processPerformance(ctx, perf);
  }

  if (ctx.xpEvents.length > 0) {
    await xpRepo.save(ctx.xpEvents);
  }
  await progressRepo.save(ctx.progress);

  return {
    userId,
    totalXp: ctx.progress.totalXp,
    eventCount: ctx.xpEvents.length,
    streak: {
      current: applyStreakExpiry(
        ctx.progress.lastActiveDate,
        ctx.progress.currentStreak,
      ),
      longest: ctx.progress.longestStreak,
    },
    lastActiveDate: ctx.progress.lastActiveDate,
    performanceCount: performances.length,
  };
}
