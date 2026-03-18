import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  SyncPerformanceEntryDto,
  SyncPushDto,
  SyncTrackedExerciseDto,
  SyncProfileDto,
} from './sync.dto.js';

function parseIsoDate(s: string): Date {
  // accepte YYYY-MM-DD ou ISO complet
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00.000Z`);
  return new Date(s);
}

function asDateOrNull(s?: string): Date | null {
  if (!s) return null;
  const d = parseIsoDate(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async push(userId: string, payload: SyncPushDto): Promise<{ ok: true }> {
    const now = new Date();

    if (payload.profile) {
      await this.upsertProfile(userId, payload.profile);
    }

    for (const ex of payload.trackedExercises ?? []) {
      await this.upsertTrackedExercise(userId, ex, now);
    }

    for (const entry of payload.performanceEntries ?? []) {
      await this.upsertPerformanceEntry(userId, entry, now);
    }

    return { ok: true };
  }

  async pull(userId: string, since?: string) {
    const sinceDate = since ? asDateOrNull(since) : null;

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        weightKg: true,
        heightCm: true,
        gender: true,
        updatedAt: true,
      },
    });

    const trackedExercises = await this.prisma.trackedExercise.findMany({
      where: {
        userId,
        ...(sinceDate
          ? {
              OR: [
                { updatedAt: { gt: sinceDate } },
                { deletedAt: { gt: sinceDate } },
              ],
            }
          : {}),
      },
    });

    const performanceEntries = await this.prisma.performanceEntry.findMany({
      where: {
        userId,
        ...(sinceDate
          ? {
              OR: [
                { updatedAt: { gt: sinceDate } },
                { deletedAt: { gt: sinceDate } },
              ],
            }
          : {}),
      },
      include: {
        trackedExercise: {
          select: {
            clientId: true,
          },
        },
      },
    });

    return {
      serverTime: new Date().toISOString(),
      profile: profile
        ? {
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            gender: profile.gender,
            updatedAt: profile.updatedAt.toISOString(),
          }
        : null,
      trackedExercises: trackedExercises.map((e) => ({
        id: e.clientId,
        exerciseId: e.exerciseId,
        name: e.name,
        originalName: e.originalName,
        bodyPart: e.bodyPart,
        target: e.target,
        equipment: e.equipment,
        category: e.category,
        gifUrl: e.gifUrl,
        isCustom: e.isCustom,
        updatedAt: e.updatedAt.toISOString(),
        deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
      })),
      performanceEntries: performanceEntries.map((p) => ({
        id: p.clientId,
        trackedExerciseId: p.trackedExercise.clientId,
        date: p.date.toISOString().slice(0, 10),
        weight: p.weight,
        reps: p.reps,
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
      })),
    };
  }

  private async upsertProfile(userId: string, p: SyncProfileDto) {
    const updatedAt = parseIsoDate(p.updatedAt);
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { updatedAt: true },
    });
    if (existing && existing.updatedAt >= updatedAt) return;
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        weightKg: p.weightKg,
        heightCm: p.heightCm,
        gender: p.gender,
      },
      update: {
        weightKg: p.weightKg,
        heightCm: p.heightCm,
        gender: p.gender,
        updatedAt,
      },
    });
  }

  private async upsertTrackedExercise(
    userId: string,
    ex: SyncTrackedExerciseDto,
    now: Date,
  ) {
    const updatedAt = asDateOrNull(ex.updatedAt) ?? now;
    const deletedAt = asDateOrNull(ex.deletedAt);

    const existing = await this.prisma.trackedExercise.findUnique({
      where: { userId_clientId: { userId, clientId: ex.id } },
      select: { userId: true, updatedAt: true, deletedAt: true },
    });
    if (existing && existing.userId !== userId) return;
    if (existing) {
      const existingLatest = (existing.deletedAt && existing.deletedAt > existing.updatedAt)
        ? existing.deletedAt
        : existing.updatedAt;
      const incomingLatest = (deletedAt && deletedAt > updatedAt) ? deletedAt : updatedAt;
      if (existingLatest >= incomingLatest) return;
    }

    await this.prisma.trackedExercise.upsert({
      where: { userId_clientId: { userId, clientId: ex.id } },
      create: {
        userId,
        clientId: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.name,
        originalName: ex.originalName ?? null,
        bodyPart: ex.bodyPart ?? null,
        target: ex.target ?? null,
        equipment: ex.equipment ?? null,
        category: ex.category ?? null,
        gifUrl: ex.gifUrl ?? null,
        isCustom: ex.isCustom ?? ex.exerciseId.startsWith('custom-'),
        updatedAt,
        deletedAt,
      },
      update: {
        exerciseId: ex.exerciseId,
        name: ex.name,
        originalName: ex.originalName ?? null,
        bodyPart: ex.bodyPart ?? null,
        target: ex.target ?? null,
        equipment: ex.equipment ?? null,
        category: ex.category ?? null,
        gifUrl: ex.gifUrl ?? null,
        isCustom: ex.isCustom ?? ex.exerciseId.startsWith('custom-'),
        updatedAt,
        deletedAt,
      },
    });
  }

  private async upsertPerformanceEntry(
    userId: string,
    entry: SyncPerformanceEntryDto,
    now: Date,
  ) {
    const updatedAt = asDateOrNull(entry.updatedAt) ?? now;
    const deletedAt = asDateOrNull(entry.deletedAt);
    const date = parseIsoDate(entry.date);

    const tracked = await this.prisma.trackedExercise.findUnique({
      where: { userId_clientId: { userId, clientId: entry.trackedExerciseId } },
      select: { id: true },
    });

    if (!tracked) {
      // sécurité: les trackedExercises sont poussés avant, mais on évite un upsert incohérent.
      return;
    }
    const existing = await this.prisma.performanceEntry.findUnique({
      where: { userId_clientId: { userId, clientId: entry.id } },
      select: { userId: true, updatedAt: true, deletedAt: true },
    });
    if (existing && existing.userId !== userId) return;
    if (existing) {
      const existingLatest = (existing.deletedAt && existing.deletedAt > existing.updatedAt)
        ? existing.deletedAt
        : existing.updatedAt;
      const incomingLatest = (deletedAt && deletedAt > updatedAt) ? deletedAt : updatedAt;
      if (existingLatest >= incomingLatest) return;
    }

    await this.prisma.performanceEntry.upsert({
      where: { userId_clientId: { userId, clientId: entry.id } },
      create: {
        userId,
        clientId: entry.id,
        trackedExerciseId: tracked.id,
        date,
        weight: entry.weight,
        reps: Math.round(entry.reps),
        updatedAt,
        deletedAt,
      },
      update: {
        trackedExerciseId: tracked.id,
        date,
        weight: entry.weight,
        reps: Math.round(entry.reps),
        updatedAt,
        deletedAt,
      },
    });
  }
}

