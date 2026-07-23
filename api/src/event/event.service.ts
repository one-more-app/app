import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';
import { RealtimeBroadcaster } from '../realtime/realtime-broadcaster.service.js';
import {
  EVENT_CATALOG_EXERCISE_NAMES,
  type EventExerciseMediaMap,
} from './event-catalog-exercises.js';
import { formatEventParticipantDisplayName } from './event-display-name.js';
import type { CreateEventEntryDto } from './dto/create-event-entry.dto.js';
import type { StartEventAttemptDto } from './dto/start-event-attempt.dto.js';
import { EventActiveAttemptEntity } from './entities/event-active-attempt.entity.js';
import { EventEntryEntity } from './entities/event-entry.entity.js';
import { EventExercise } from './entities/event-exercise.enum.js';
import { EventGender } from './entities/event-gender.enum.js';

export const EVENT_LEADERBOARD_LIMIT = 30;
export const EVENT_RECENT_LIMIT = 10;

export type EventLeaderboardRow = {
  id: string;
  firstName: string;
  displayName: string;
  reps: number;
  rank: number;
};

export type EventLeaderboardBoard = Record<
  EventExercise,
  Record<EventGender, EventLeaderboardRow[]>
>;

export type EventRecentEntry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: EventGender;
  exercise: EventExercise;
  reps: number;
  notes: string | null;
  beatPreviousLeader: boolean;
  tshirtAwarded: boolean;
  rank: number;
  createdAt: string;
};

export type CreateEventEntryResult = {
  id: string;
  firstName: string;
  gender: EventGender;
  exercise: EventExercise;
  reps: number;
  beatPreviousLeader: boolean;
  tshirtAwarded: boolean;
  celebrationPending: boolean;
  rank: number;
  createdAt: string;
};

export type EventActiveCelebration = {
  entryId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  reps: number;
  exercise: EventExercise;
  gender: EventGender;
};

export type EventActiveAttempt = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  gender: EventGender;
  exercise: EventExercise;
  notes: string | null;
  reps: number;
  startedAt: string;
};

export type EventAttemptResult = {
  entryId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  reps: number;
  exercise: EventExercise;
  gender: EventGender;
  rank: number;
  beatPreviousLeader: boolean;
};

const ALL_EXERCISES = [
  EventExercise.PullUp,
  EventExercise.Dips,
  EventExercise.PushUp,
] as const;

const ALL_GENDERS = [EventGender.Male, EventGender.Female] as const;

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntryEntity)
    private readonly entriesRepo: Repository<EventEntryEntity>,
    @InjectRepository(EventActiveAttemptEntity)
    private readonly attemptRepo: Repository<EventActiveAttemptEntity>,
    @InjectRepository(ExerciseCatalogEntity)
    private readonly catalogRepo: Repository<ExerciseCatalogEntity>,
    private readonly realtime: RealtimeBroadcaster,
  ) {}

  async getLeaderboardPayload(limit = EVENT_LEADERBOARD_LIMIT): Promise<{
    board: EventLeaderboardBoard;
    exerciseMedia: EventExerciseMediaMap;
    activeCelebration: EventActiveCelebration | null;
    activeAttempt: EventActiveAttempt | null;
    recentResult: EventAttemptResult | null;
  }> {
    const [board, exerciseMedia, activeCelebration, activeAttempt] =
      await Promise.all([
        this.getLeaderboard(limit),
        this.getExerciseMedia(),
        this.getActiveCelebration(),
        this.getActiveAttempt(),
      ]);
    return {
      board,
      exerciseMedia,
      activeCelebration,
      activeAttempt,
      recentResult: await this.getRecentAttemptResult(),
    };
  }

  private async publishLeaderboard(): Promise<void> {
    const payload = await this.getLeaderboardPayload();
    this.realtime.emitEventLeaderboardUpdate(payload);
  }

  async softDeleteAllEventData(): Promise<{
    deletedEntries: number;
    clearedAttempt: boolean;
  }> {
    const result = await this.entriesRepo.update(
      { deletedAt: IsNull() },
      {
        deletedAt: new Date(),
        celebrationPending: false,
        resultDisplayPending: false,
      },
    );
    const attemptCount = await this.attemptRepo.count();
    if (attemptCount > 0) {
      await this.attemptRepo.clear();
    }
    const response = {
      deletedEntries: result.affected ?? 0,
      clearedAttempt: attemptCount > 0,
    };
    await this.publishLeaderboard();
    return response;
  }

  async getActiveCelebration(): Promise<EventActiveCelebration | null> {
    const entry = await this.entriesRepo.findOne({
      where: { celebrationPending: true, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!entry) return null;

    return {
      entryId: entry.id,
      firstName: entry.firstName.trim(),
      lastName: entry.lastName.trim(),
      displayName: formatEventParticipantDisplayName(
        entry.firstName,
        entry.lastName,
      ),
      reps: entry.reps,
      exercise: entry.exercise,
      gender: entry.gender,
    };
  }

  async dismissActiveCelebration(): Promise<{ dismissed: boolean }> {
    const result = await this.entriesRepo.update(
      { celebrationPending: true, deletedAt: IsNull() },
      { celebrationPending: false },
    );
    const response = { dismissed: (result.affected ?? 0) > 0 };
    if (response.dismissed) {
      await this.publishLeaderboard();
    }
    return response;
  }

  async dismissRecentAttemptResult(): Promise<{ dismissed: boolean }> {
    const result = await this.entriesRepo.update(
      { resultDisplayPending: true, deletedAt: IsNull() },
      { resultDisplayPending: false },
    );
    const response = { dismissed: (result.affected ?? 0) > 0 };
    if (response.dismissed) {
      await this.publishLeaderboard();
    }
    return response;
  }

  async dismissTvDisplay(): Promise<{
    dismissedResult: boolean;
    dismissedCelebration: boolean;
  }> {
    const [resultUpdate, celebrationUpdate] = await Promise.all([
      this.entriesRepo.update(
        { resultDisplayPending: true, deletedAt: IsNull() },
        { resultDisplayPending: false },
      ),
      this.entriesRepo.update(
        { celebrationPending: true, deletedAt: IsNull() },
        { celebrationPending: false },
      ),
    ]);
    const response = {
      dismissedResult: (resultUpdate.affected ?? 0) > 0,
      dismissedCelebration: (celebrationUpdate.affected ?? 0) > 0,
    };
    if (response.dismissedResult || response.dismissedCelebration) {
      await this.publishLeaderboard();
    }
    return response;
  }

  async getActiveAttempt(): Promise<EventActiveAttempt | null> {
    const attempt = await this.findLatestAttemptEntity();
    if (!attempt) return null;
    return this.toActiveAttempt(attempt);
  }

  async startAttempt(dto: StartEventAttemptDto): Promise<EventActiveAttempt> {
    await this.attemptRepo.clear();
    await this.entriesRepo.update(
      { resultDisplayPending: true, deletedAt: IsNull() },
      { resultDisplayPending: false },
    );

    const notes = dto.notes?.trim() ? dto.notes.trim() : null;
    const saved = await this.attemptRepo.save(
      this.attemptRepo.create({
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.trim().toLowerCase(),
        gender: dto.gender,
        exercise: dto.exercise,
        notes,
        reps: 0,
      }),
    );

    const active = this.toActiveAttempt(saved);
    await this.publishLeaderboard();
    return active;
  }

  async patchAttemptReps(reps: number): Promise<EventActiveAttempt> {
    const attempt = await this.requireActiveAttempt();
    attempt.reps = reps;
    const saved = await this.attemptRepo.save(attempt);
    const active = this.toActiveAttempt(saved);
    this.realtime.emitEventAttemptUpdate(active);
    return active;
  }

  async finalizeAttempt(): Promise<{
    entry: CreateEventEntryResult;
    attemptResult: EventAttemptResult;
  }> {
    const attempt = await this.requireActiveAttempt();
    if (attempt.reps < 1) {
      throw new BadRequestException('At least one rep is required to finalize');
    }

    const entry = await this.createEntry(
      {
        firstName: attempt.firstName,
        lastName: attempt.lastName,
        email: attempt.email,
        gender: attempt.gender,
        exercise: attempt.exercise,
        reps: attempt.reps,
        notes: attempt.notes ?? undefined,
      },
      { publish: false },
    );

    const attemptResult: EventAttemptResult = {
      entryId: entry.id,
      firstName: attempt.firstName,
      lastName: attempt.lastName,
      displayName: formatEventParticipantDisplayName(
        attempt.firstName,
        attempt.lastName,
      ),
      reps: attempt.reps,
      exercise: attempt.exercise,
      gender: attempt.gender,
      rank: entry.rank,
      beatPreviousLeader: entry.beatPreviousLeader,
    };

    await this.attemptRepo.clear();
    await this.publishLeaderboard();

    return { entry, attemptResult };
  }

  async cancelAttempt(): Promise<{ cancelled: boolean }> {
    const count = await this.attemptRepo.count();
    if (count === 0) {
      return { cancelled: false };
    }
    await this.attemptRepo.clear();
    await this.publishLeaderboard();
    return { cancelled: true };
  }

  private async getRecentAttemptResult(): Promise<EventAttemptResult | null> {
    const entry = await this.entriesRepo.findOne({
      where: { resultDisplayPending: true, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!entry) return null;

    const rank = await this.getRankForEntry(entry);

    return {
      entryId: entry.id,
      firstName: entry.firstName.trim(),
      lastName: entry.lastName.trim(),
      displayName: formatEventParticipantDisplayName(
        entry.firstName,
        entry.lastName,
      ),
      reps: entry.reps,
      exercise: entry.exercise,
      gender: entry.gender,
      rank,
      beatPreviousLeader: entry.beatPreviousLeader,
    };
  }

  private async requireActiveAttempt(): Promise<EventActiveAttemptEntity> {
    const attempt = await this.findLatestAttemptEntity();
    if (!attempt) {
      throw new NotFoundException('No active attempt');
    }
    return attempt;
  }

  private async findLatestAttemptEntity(): Promise<EventActiveAttemptEntity | null> {
    const attempts = await this.attemptRepo.find({
      order: { startedAt: 'DESC' },
      take: 1,
    });
    return attempts[0] ?? null;
  }

  private toActiveAttempt(
    attempt: EventActiveAttemptEntity,
  ): EventActiveAttempt {
    return {
      id: attempt.id,
      firstName: attempt.firstName,
      lastName: attempt.lastName,
      displayName: formatEventParticipantDisplayName(
        attempt.firstName,
        attempt.lastName,
      ),
      email: attempt.email,
      gender: attempt.gender,
      exercise: attempt.exercise,
      notes: attempt.notes,
      reps: attempt.reps,
      startedAt: attempt.startedAt.toISOString(),
    };
  }

  async getExerciseMedia(): Promise<EventExerciseMediaMap> {
    const catalogNames = Object.values(EVENT_CATALOG_EXERCISE_NAMES);
    const rows = await this.catalogRepo.find({
      where: { name: In(catalogNames) },
    });
    const byName = new Map(rows.map((row) => [row.name, row]));

    const media = {} as EventExerciseMediaMap;
    for (const exercise of ALL_EXERCISES) {
      const catalogName = EVENT_CATALOG_EXERCISE_NAMES[exercise];
      const row = byName.get(catalogName);
      media[exercise] = {
        gifUrl: row?.gifUrl ?? null,
        name: row?.name ?? catalogName,
        nameFr: row?.nameFr ?? null,
      };
    }
    return media;
  }

  async getLeaderboard(
    limit = EVENT_LEADERBOARD_LIMIT,
  ): Promise<EventLeaderboardBoard> {
    const board = {} as EventLeaderboardBoard;

    for (const exercise of ALL_EXERCISES) {
      board[exercise] = {} as Record<EventGender, EventLeaderboardRow[]>;
      for (const gender of ALL_GENDERS) {
        board[exercise][gender] = await this.getTopRows(
          exercise,
          gender,
          limit,
        );
      }
    }

    return board;
  }

  async getRecentEntries(
    limit = EVENT_RECENT_LIMIT,
  ): Promise<EventRecentEntry[]> {
    const entries = await this.entriesRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return Promise.all(
      entries.map(async (entry) => ({
        id: entry.id,
        firstName: entry.firstName,
        lastName: entry.lastName,
        email: entry.email,
        gender: entry.gender,
        exercise: entry.exercise,
        reps: entry.reps,
        notes: entry.notes,
        beatPreviousLeader: entry.beatPreviousLeader,
        tshirtAwarded: entry.tshirtAwarded,
        rank: await this.getRankForEntry(entry),
        createdAt: entry.createdAt.toISOString(),
      })),
    );
  }

  async createEntry(
    dto: CreateEventEntryDto,
    options?: { publish?: boolean },
  ): Promise<CreateEventEntryResult> {
    const previousTop = await this.getTopEntry(dto.exercise, dto.gender);
    const beatPreviousLeader =
      previousTop == null || dto.reps > previousTop.reps;

    const notes = dto.notes?.trim() ? dto.notes.trim() : null;

    if (beatPreviousLeader) {
      await this.entriesRepo.update(
        { celebrationPending: true, deletedAt: IsNull() },
        { celebrationPending: false },
      );
    }

    await this.entriesRepo.update(
      { resultDisplayPending: true, deletedAt: IsNull() },
      { resultDisplayPending: false },
    );

    const saved = await this.entriesRepo.save(
      this.entriesRepo.create({
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.trim().toLowerCase(),
        gender: dto.gender,
        exercise: dto.exercise,
        reps: dto.reps,
        notes,
        beatPreviousLeader,
        tshirtAwarded: beatPreviousLeader,
        celebrationPending: beatPreviousLeader,
        resultDisplayPending: true,
        deletedAt: null,
      }),
    );

    const rank = await this.getRankForEntry(saved);

    const result = {
      id: saved.id,
      firstName: saved.firstName,
      gender: saved.gender,
      exercise: saved.exercise,
      reps: saved.reps,
      beatPreviousLeader: saved.beatPreviousLeader,
      tshirtAwarded: saved.tshirtAwarded,
      celebrationPending: saved.celebrationPending,
      rank,
      createdAt: saved.createdAt.toISOString(),
    };

    if (options?.publish !== false) {
      await this.publishLeaderboard();
    }

    return result;
  }

  private async getTopEntry(
    exercise: EventExercise,
    gender: EventGender,
  ): Promise<EventEntryEntity | null> {
    return await this.entriesRepo.findOne({
      where: { exercise, gender, deletedAt: IsNull() },
      order: { reps: 'DESC', createdAt: 'ASC' },
    });
  }

  private async getTopRows(
    exercise: EventExercise,
    gender: EventGender,
    limit: number,
  ): Promise<EventLeaderboardRow[]> {
    const entries = await this.entriesRepo.find({
      where: { exercise, gender, deletedAt: IsNull() },
      order: { reps: 'DESC', createdAt: 'ASC' },
      take: limit,
    });

    return entries.map((entry, index) => ({
      id: entry.id,
      firstName: entry.firstName,
      displayName: formatEventParticipantDisplayName(
        entry.firstName,
        entry.lastName,
      ),
      reps: entry.reps,
      rank: index + 1,
    }));
  }

  private async getRankForEntry(entry: EventEntryEntity): Promise<number> {
    const betterCount = await this.entriesRepo
      .createQueryBuilder('entry')
      .where('entry.exercise = :exercise', { exercise: entry.exercise })
      .andWhere('entry.gender = :gender', { gender: entry.gender })
      .andWhere('entry.deletedAt IS NULL')
      .andWhere(
        `(entry.reps > :reps OR (entry.reps = :reps AND entry.createdAt < :createdAt))`,
        { reps: entry.reps, createdAt: entry.createdAt },
      )
      .getCount();

    return betterCount + 1;
  }
}
