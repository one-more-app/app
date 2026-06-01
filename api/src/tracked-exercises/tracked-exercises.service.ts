import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { AccessService } from '../social/access.service.js';
import { TrackedExerciseEntity } from './tracked-exercise.entity.js';
import type {
  CreateTrackedExerciseDto,
  UpdateTrackedExerciseDto,
} from './tracked-exercises.dto.js';

@Injectable()
export class TrackedExercisesService {
  constructor(
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
    private readonly accessService: AccessService,
  ) {}

  private mapTrackedExercise(entity: TrackedExerciseEntity) {
    return {
      id: entity.clientId,
      exerciseId: entity.exerciseId,
      name: entity.name,
      originalName: entity.originalName,
      bodyPart: entity.bodyPart,
      target: entity.target,
      equipment: entity.equipment,
      category: entity.category,
      gifUrl: entity.gifUrl,
      isCustom: entity.isCustom,
      updatedAt: entity.updatedAt.toISOString(),
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }

  private mapPerformance(
    entity: PerformanceEntryEntity,
    trackedByDbId: Map<string, string>,
  ) {
    return {
      id: entity.clientId,
      trackedExerciseId: trackedByDbId.get(entity.trackedExerciseId) ?? '',
      date: entity.date,
      weight: entity.weight,
      reps: entity.reps,
      createdAt: entity.updatedAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }

  async list(userId: string, includeDeleted = false) {
    const list = await this.trackedRepo.find({
      where: {
        userId,
        ...(includeDeleted ? {} : { deletedAt: IsNull() }),
      },
      order: { updatedAt: 'DESC' },
    });
    return list.map((e) => this.mapTrackedExercise(e));
  }

  async listWithPerformance(userId: string) {
    const tracked = await this.trackedRepo.find({
      where: {
        userId,
        deletedAt: IsNull(),
      },
      order: { updatedAt: 'DESC' },
    });

    if (tracked.length === 0) return [];

    const trackedDbIds = tracked.map((item) => item.id);
    const trackedByDbId = new Map(tracked.map((item) => [item.id, item.clientId]));

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
      if (list) {
        list.push(entry);
      } else {
        entriesByTrackedId.set(entry.trackedExerciseId, [entry]);
      }
    }

    return tracked.map((item) => {
      const itemEntries = entriesByTrackedId.get(item.id) ?? [];
      const lastPerfEntity = itemEntries[itemEntries.length - 1];
      const personalBestEntity = itemEntries.reduce<PerformanceEntryEntity | undefined>(
        (best, curr) => {
          if (!best) return curr;
          if (curr.weight > best.weight) return curr;
          if (curr.weight === best.weight && curr.reps > best.reps) return curr;
          return best;
        },
        undefined,
      );

      return {
        ...this.mapTrackedExercise(item),
        lastPerf: lastPerfEntity
          ? this.mapPerformance(lastPerfEntity, trackedByDbId)
          : null,
        personalBest: personalBestEntity
          ? this.mapPerformance(personalBestEntity, trackedByDbId)
          : null,
      };
    });
  }

  async create(userId: string, body: CreateTrackedExerciseDto) {
    const isNew = await this.accessService.isNewActiveExercise(userId, body.id);
    if (isNew) {
      await this.accessService.assertCanAddExercise(userId);
    }

    await this.trackedRepo.upsert(
      {
        userId,
        clientId: body.id,
        exerciseId: body.exerciseId,
        name: body.name,
        originalName: body.originalName ?? null,
        bodyPart: body.bodyPart ?? null,
        target: body.target ?? null,
        equipment: body.equipment ?? null,
        category: body.category ?? null,
        gifUrl: body.gifUrl ?? null,
        isCustom: body.isCustom ?? body.exerciseId.startsWith('custom-'),
        deletedAt: null,
      },
      ['userId', 'clientId'],
    );
    const entity = await this.trackedRepo.findOneOrFail({
      where: { userId, clientId: body.id },
    });
    return this.mapTrackedExercise(entity);
  }

  async update(userId: string, clientId: string, body: UpdateTrackedExerciseDto) {
    const existing = await this.trackedRepo.findOne({
      where: { userId, clientId },
    });
    if (!existing) throw new NotFoundException('Exercice introuvable');

    existing.name = body.name ?? existing.name;
    const entity = await this.trackedRepo.save(existing);
    return this.mapTrackedExercise(entity);
  }

  async remove(userId: string, clientId: string) {
    const existing = await this.trackedRepo.findOne({
      where: { userId, clientId },
    });
    if (!existing) throw new NotFoundException('Exercice introuvable');
    existing.deletedAt = new Date();
    await this.trackedRepo.save(existing);
    return { ok: true };
  }
}
