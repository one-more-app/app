import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  computeBrowseLeagueLookups,
  computeLeagueStatsForTracked,
  didRankPromote as ranksDidPromote,
  getTopExercisesByLeague,
  leagueFromTrackedExercise,
  type LeagueProfileInput,
  type TrackedExerciseLeagueInput,
} from '../shared/league-aggregate.js';
import { getAllTiers, type LeagueInfo } from '../shared/strength-standards.js';
import {
  getPersonalBestFromEntries,
  isNewPersonalBest,
} from '../progress/lib/personal-best.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import type {
  HistoryEntryLeagueInsightDto,
  LeagueChangeDto,
  LeagueSummaryDto,
} from './dto/league-response.dto.js';

@Injectable()
export class LeagueService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
  ) {}

  async getProfileInput(userId: string): Promise<LeagueProfileInput | null> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile?.weightKg || !profile.gender) return null;
    return {
      weightKg: profile.weightKg,
      gender: profile.gender === 'female' ? 'female' : 'male',
    };
  }

  toLeagueInputFromTracked(
    tracked: {
      clientId: string;
      name: string;
      originalName: string | null;
      bodyPart: string | null;
      target: string | null;
      equipment: string | null;
      isCustom: boolean;
      personalBest?: { weight: number; reps: number } | null;
    },
  ): TrackedExerciseLeagueInput {
    return {
      id: tracked.clientId,
      name: tracked.name,
      originalName: tracked.originalName,
      bodyPart: tracked.bodyPart,
      target: tracked.target,
      equipment: tracked.equipment,
      isCustom: tracked.isCustom,
      personalBest: tracked.personalBest ?? null,
    };
  }

  leagueFromTrackedEntity(
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

  didRankPromote(before: LeagueInfo | null, after: LeagueInfo | null): boolean {
    return ranksDidPromote(before, after);
  }

  computeLeagueChange(
    tracked: TrackedExerciseEntity,
    prevPb: { weight: number; reps: number } | null,
    nextPb: { weight: number; reps: number } | null,
    profile: LeagueProfileInput | null,
  ): LeagueChangeDto {
    const before = this.leagueFromTrackedEntity(tracked, prevPb, profile);
    const after = this.leagueFromTrackedEntity(tracked, nextPb, profile);
    return {
      before,
      after,
      promoted: ranksDidPromote(before, after),
    };
  }

  /** Exercices suivis + PB pour agrégats ligue (évite import circulaire avec TrackedExercisesService). */
  private async loadTrackedLeagueInputs(
    userId: string,
  ): Promise<TrackedExerciseLeagueInput[]> {
    const tracked = await this.trackedRepo.find({
      where: { userId, deletedAt: IsNull() },
      order: { updatedAt: 'DESC' },
    });
    if (tracked.length === 0) return [];

    const trackedDbIds = tracked.map((item) => item.id);
    const entries = await this.perfRepo.find({
      where: {
        userId,
        trackedExerciseId: In(trackedDbIds),
        deletedAt: IsNull(),
      },
      order: { date: 'ASC', updatedAt: 'ASC' },
    });

    const entriesByTrackedId = new Map<string, PerformanceEntryEntity[]>();
    for (const entry of entries) {
      const list = entriesByTrackedId.get(entry.trackedExerciseId);
      if (list) list.push(entry);
      else entriesByTrackedId.set(entry.trackedExerciseId, [entry]);
    }

    return tracked.map((item) => {
      const itemEntries = entriesByTrackedId.get(item.id) ?? [];
      const personalBestEntity = itemEntries.reduce<
        PerformanceEntryEntity | undefined
      >((best, curr) => {
        if (!best) return curr;
        if (curr.weight > best.weight) return curr;
        if (curr.weight === best.weight && curr.reps > best.reps) return curr;
        return best;
      }, undefined);

      return {
        id: item.clientId,
        name: item.name,
        originalName: item.originalName,
        bodyPart: item.bodyPart,
        target: item.target,
        equipment: item.equipment,
        isCustom: item.isCustom,
        personalBest: personalBestEntity
          ? { weight: personalBestEntity.weight, reps: personalBestEntity.reps }
          : null,
      };
    });
  }

  async buildSummary(userId: string): Promise<LeagueSummaryDto | null> {
    const profile = await this.getProfileInput(userId);
    if (!profile) return null;

    const inputs = await this.loadTrackedLeagueInputs(userId);

    const summary = computeLeagueStatsForTracked(inputs, profile);
    if (!summary) return null;

    return {
      ...summary,
      topByLeague: getTopExercisesByLeague(inputs, profile),
    };
  }

  async buildBrowseLookups(userId: string) {
    const profile = await this.getProfileInput(userId);
    if (!profile) {
      return { byZone: {}, targetInZone: {}, equipmentInPath: {} };
    }

    const inputs = await this.loadTrackedLeagueInputs(userId);
    return computeBrowseLeagueLookups(inputs, profile);
  }

  async buildTierLadder(userId: string, trackedClientId: string) {
    const profile = await this.getProfileInput(userId);
    if (!profile) return null;

    const tracked = await this.trackedRepo.findOne({
      where: { userId, clientId: trackedClientId, deletedAt: IsNull() },
    });
    if (!tracked) throw new NotFoundException('Exercice suivi introuvable');

    const tiers = getAllTiers(profile.weightKg, profile.gender, tracked.originalName ?? tracked.name, {
      equipment: tracked.equipment ?? undefined,
      target: tracked.target ?? undefined,
      bodyPart: tracked.bodyPart ?? undefined,
    });

    return tiers ? { tiers } : null;
  }

  async buildHistoryInsights(
    userId: string,
    entries: {
      id: string;
      trackedExerciseId: string;
      date: string;
      weight: number;
      reps: number;
      createdAt?: string;
    }[],
  ): Promise<Record<string, HistoryEntryLeagueInsightDto>> {
    const profile = await this.getProfileInput(userId);
    const out: Record<string, HistoryEntryLeagueInsightDto> = {};
    if (!profile) {
      for (const e of entries) {
        out[e.id] = {
          isRecord: false,
          leagueUp: false,
          prevLeague: null,
          nextLeague: null,
        };
      }
      return out;
    }

    const trackedList = await this.trackedRepo.find({
      where: { userId },
    });
    const trackedByClientId = new Map(
      trackedList.map((t) => [t.clientId, t]),
    );

    const byTracked = new Map<string, typeof entries>();
    for (const e of entries) {
      const arr = byTracked.get(e.trackedExerciseId) ?? [];
      arr.push(e);
      byTracked.set(e.trackedExerciseId, arr);
    }

    for (const [, list] of byTracked) {
      list.sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (ca !== cb) return ca - cb;
        return a.id.localeCompare(b.id);
      });

      for (let i = 0; i < list.length; i++) {
        const entry = list[i]!;
        const before = list.slice(0, i);
        const prevPB = getPersonalBestFromEntries(before);
        const isRecord = isNewPersonalBest(prevPB, {
          weight: entry.weight,
          reps: entry.reps,
        });
        const newPB = !prevPB
          ? { weight: entry.weight, reps: entry.reps }
          : isRecord
            ? { weight: entry.weight, reps: entry.reps }
            : prevPB;

        const tracked = trackedByClientId.get(entry.trackedExerciseId);
        if (!tracked) {
          out[entry.id] = {
            isRecord,
            leagueUp: false,
            prevLeague: null,
            nextLeague: null,
          };
          continue;
        }

        const prevLeague = this.leagueFromTrackedEntity(tracked, prevPB, profile);
        const nextLeague = this.leagueFromTrackedEntity(tracked, newPB, profile);
        const leagueUp = ranksDidPromote(prevLeague, nextLeague);

        out[entry.id] = {
          isRecord,
          leagueUp,
          prevLeague,
          nextLeague,
        };
      }
    }

    return out;
  }

  attachLeagueToExercises<
    T extends {
      id: string;
      name: string;
      originalName?: string | null;
      bodyPart?: string | null;
      target?: string | null;
      equipment?: string | null;
      isCustom: boolean;
      personalBest?: { weight: number; reps: number } | null;
    },
  >(exercises: T[], profile: LeagueProfileInput | null): (T & { league: LeagueInfo | null })[] {
    return exercises.map((ex) => ({
      ...ex,
      league: profile
        ? leagueFromTrackedExercise(
            {
              id: ex.id,
              name: ex.name,
              originalName: ex.originalName,
              bodyPart: ex.bodyPart,
              target: ex.target,
              equipment: ex.equipment,
              isCustom: ex.isCustom,
              personalBest: ex.personalBest,
            },
            profile,
          )
        : null,
    }));
  }
}
