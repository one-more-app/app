import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeagueService } from '../league/league.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { PerformanceEntryEntity } from './performance-entry.entity.js';
import type {
  CreatePerformanceEntryDto,
  UpdatePerformanceEntryDto,
} from './performance-entries.dto.js';

function parseIsoDate(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00.000Z`);
  return new Date(s);
}

@Injectable()
export class PerformanceEntriesService {
  constructor(
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
    private readonly progressService: ProgressService,
    private readonly leagueService: LeagueService,
  ) {}

  async list(
    userId: string,
    opts?: {
      trackedExerciseId?: string;
      includeDeleted?: boolean;
      withLeagueInsights?: boolean;
    },
  ) {
    const qb = this.perfRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.trackedExercise', 'tracked')
      .where('entry.userId = :userId', { userId });
    if (!opts?.includeDeleted) {
      qb.andWhere('entry.deletedAt IS NULL');
    }
    if (opts?.trackedExerciseId) {
      qb.andWhere('tracked.userId = :userId', { userId });
      qb.andWhere('tracked.clientId = :trackedClientId', {
        trackedClientId: opts.trackedExerciseId,
      });
    }
    qb.orderBy('entry.date', 'DESC').addOrderBy('entry.updatedAt', 'DESC');
    const list = await qb.getMany();

    const mapped = list.map((e) => ({
      id: e.clientId,
      trackedExerciseId: e.trackedExercise.clientId,
      date: e.date,
      weight: e.weight,
      reps: e.reps,
      createdAt: e.updatedAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
    }));

    if (!opts?.withLeagueInsights) return mapped;

    const insights = await this.leagueService.buildHistoryInsights(
      userId,
      mapped.map((e) => ({
        id: e.id,
        trackedExerciseId: e.trackedExerciseId,
        date: e.date,
        weight: e.weight,
        reps: e.reps,
        createdAt: e.createdAt,
      })),
    );

    return mapped.map((e) => ({
      ...e,
      leagueInsight: insights[e.id] ?? {
        isRecord: false,
        leagueUp: false,
        prevLeague: null,
        nextLeague: null,
      },
    }));
  }

  async create(userId: string, body: CreatePerformanceEntryDto) {
    const tracked = await this.trackedRepo.findOne({
      where: { userId, clientId: body.trackedExerciseId },
      select: ['id'],
    });
    if (!tracked) throw new NotFoundException('Exercice suivi introuvable');

    await this.perfRepo.upsert(
      {
        userId,
        clientId: body.id,
        trackedExerciseId: tracked.id,
        date: parseIsoDate(body.date).toISOString().slice(0, 10),
        weight: body.weight,
        reps: Math.round(body.reps),
        deletedAt: null,
      },
      ['userId', 'clientId'],
    );
    const entity = await this.perfRepo.findOneOrFail({
      where: { userId, clientId: body.id },
      relations: { trackedExercise: true },
    });

    const activityDate = entity.date;
    const xp = await this.progressService.processPerformanceAdded({
      userId,
      perfClientId: body.id,
      trackedExerciseClientId: body.trackedExerciseId,
      activityDate,
      weight: entity.weight,
      reps: entity.reps,
    });

    return {
      id: entity.clientId,
      trackedExerciseId: entity.trackedExercise.clientId,
      date: entity.date,
      weight: entity.weight,
      reps: entity.reps,
      createdAt: entity.updatedAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
      xp,
    };
  }

  async update(userId: string, clientId: string, body: UpdatePerformanceEntryDto) {
    const existing = await this.perfRepo.findOne({
      where: { userId, clientId },
      relations: { trackedExercise: true },
    });
    if (!existing) throw new NotFoundException('Performance introuvable');

    if (body.date !== undefined) {
      existing.date = parseIsoDate(body.date).toISOString().slice(0, 10);
    }
    if (body.weight !== undefined) existing.weight = body.weight;
    if (body.reps !== undefined) existing.reps = Math.round(body.reps);
    const entity = await this.perfRepo.save(existing);
    return {
      id: entity.clientId,
      trackedExerciseId: entity.trackedExercise.clientId,
      date: entity.date,
      weight: entity.weight,
      reps: entity.reps,
      createdAt: entity.updatedAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }

  async remove(userId: string, clientId: string) {
    const existing = await this.perfRepo.findOne({
      where: { userId, clientId },
    });
    if (!existing) throw new NotFoundException('Performance introuvable');
    existing.deletedAt = new Date();
    await this.perfRepo.save(existing);
    return { ok: true };
  }
}
