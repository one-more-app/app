import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { SESSION_ACTIVE_IDLE_MS } from '../shared/session-timing.js';
import { SessionEndEntity } from './entities/session-end.entity.js';
import { WorkoutSessionEntity } from './entities/workout-session.entity.js';

/**
 * Création / clôture / lazy-close des séances first-class.
 * Partagé par WorkoutSessionsService et PerformanceEntriesService.
 */
@Injectable()
export class SessionLifecycleService {
  constructor(
    @InjectRepository(WorkoutSessionEntity)
    private readonly sessionsRepo: Repository<WorkoutSessionEntity>,
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
    @InjectRepository(SessionEndEntity)
    private readonly endsRepo: Repository<SessionEndEntity>,
  ) {}

  async findById(sessionId: string): Promise<WorkoutSessionEntity> {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Séance introuvable');
    return session;
  }

  async listForDay(
    ownerUserId: string,
    sessionDate: string,
  ): Promise<WorkoutSessionEntity[]> {
    return await this.sessionsRepo.find({
      where: { ownerUserId, sessionDate },
      order: { startedAt: 'ASC' },
    });
  }

  async findOpenSession(
    ownerUserId: string,
  ): Promise<WorkoutSessionEntity | null> {
    return await this.sessionsRepo.findOne({
      where: { ownerUserId, endedAt: IsNull() },
      order: { startedAt: 'DESC' },
    });
  }

  async getLastSetAt(sessionId: string): Promise<Date | null> {
    const row = await this.perfRepo
      .createQueryBuilder('p')
      .select('MAX(p.updatedAt)', 'max')
      .where('p.workoutSessionId = :sessionId', { sessionId })
      .andWhere('p.deletedAt IS NULL')
      .getRawOne<{ max: Date | string | null }>();
    if (!row?.max) return null;
    return row.max instanceof Date ? row.max : new Date(row.max);
  }

  /** Persiste endedAt si idle ≥ 25 min. */
  async lazyCloseIfIdle(
    session: WorkoutSessionEntity,
    now = Date.now(),
  ): Promise<WorkoutSessionEntity> {
    if (session.endedAt) return session;
    const lastSetAt = await this.getLastSetAt(session.id);
    const ref = lastSetAt ?? session.startedAt;
    if (now - ref.getTime() < SESSION_ACTIVE_IDLE_MS) return session;
    session.endedAt = ref;
    const saved = await this.sessionsRepo.save(session);
    await this.syncLegacyEnd(saved);
    return saved;
  }

  async endSessionNow(
    session: WorkoutSessionEntity,
    endedAt = new Date(),
  ): Promise<WorkoutSessionEntity> {
    if (session.endedAt) return session;
    session.endedAt = endedAt;
    const saved = await this.sessionsRepo.save(session);
    await this.syncLegacyEnd(saved);
    return saved;
  }

  /**
   * Attache une série à la session ouverte, ou en crée une nouvelle
   * (après idle / end / changement de jour).
   */
  async attachOrCreateSession(
    ownerUserId: string,
    sessionDate: string,
    setAt: Date = new Date(),
  ): Promise<WorkoutSessionEntity> {
    const open = await this.findOpenSession(ownerUserId);
    if (open) {
      const lastSetAt = await this.getLastSetAt(open.id);
      const ref = lastSetAt ?? open.startedAt;
      const idleMs = setAt.getTime() - ref.getTime();
      if (
        idleMs >= SESSION_ACTIVE_IDLE_MS ||
        open.sessionDate !== sessionDate
      ) {
        open.endedAt = ref;
        await this.sessionsRepo.save(open);
        await this.syncLegacyEnd(open);
      } else {
        return open;
      }
    }

    const created = this.sessionsRepo.create({
      ownerUserId,
      sessionDate,
      startedAt: setAt,
      endedAt: null,
    });
    return await this.sessionsRepo.save(created);
  }

  /** Garde la table ends (legacy) alignée sur la dernière fin du jour. */
  async syncLegacyEnd(session: WorkoutSessionEntity): Promise<void> {
    if (!session.endedAt) return;
    let row = await this.endsRepo.findOne({
      where: {
        ownerUserId: session.ownerUserId,
        sessionDate: session.sessionDate,
      },
    });
    if (!row) {
      row = this.endsRepo.create({
        ownerUserId: session.ownerUserId,
        sessionDate: session.sessionDate,
        workoutSessionId: session.id,
        endedAt: session.endedAt,
      });
    } else {
      row.endedAt = session.endedAt;
      row.workoutSessionId = session.id;
    }
    await this.endsRepo.save(row);
  }

  isSessionLive(
    session: WorkoutSessionEntity,
    opts: {
      todayKey: string;
      isPresenceTraining: boolean;
      lastSetAt: Date | null;
      now?: number;
    },
  ): boolean {
    if (session.endedAt) return false;
    if (session.sessionDate !== opts.todayKey) return false;
    const now = opts.now ?? Date.now();
    if (opts.isPresenceTraining) return true;
    const ref = opts.lastSetAt ?? session.startedAt;
    return now - ref.getTime() < SESSION_ACTIVE_IDLE_MS;
  }
}
