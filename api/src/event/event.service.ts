import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';
import {
  EVENT_CATALOG_EXERCISE_NAMES,
  type EventExerciseMediaMap,
} from './event-catalog-exercises.js';
import { formatEventParticipantDisplayName } from './event-display-name.js';
import type { CreateEventEntryDto } from './dto/create-event-entry.dto.js';
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
    @InjectRepository(ExerciseCatalogEntity)
    private readonly catalogRepo: Repository<ExerciseCatalogEntity>,
  ) {}

  async getLeaderboardPayload(limit = EVENT_LEADERBOARD_LIMIT): Promise<{
    board: EventLeaderboardBoard;
    exerciseMedia: EventExerciseMediaMap;
    activeCelebration: EventActiveCelebration | null;
  }> {
    const [board, exerciseMedia, activeCelebration] = await Promise.all([
      this.getLeaderboard(limit),
      this.getExerciseMedia(),
      this.getActiveCelebration(),
    ]);
    return { board, exerciseMedia, activeCelebration };
  }

  async getActiveCelebration(): Promise<EventActiveCelebration | null> {
    const entry = await this.entriesRepo.findOne({
      where: { celebrationPending: true },
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
      { celebrationPending: true },
      { celebrationPending: false },
    );
    return { dismissed: (result.affected ?? 0) > 0 };
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

  async createEntry(dto: CreateEventEntryDto): Promise<CreateEventEntryResult> {
    const previousTop = await this.getTopEntry(dto.exercise, dto.gender);
    const beatPreviousLeader =
      previousTop == null || dto.reps > previousTop.reps;

    const notes = dto.notes?.trim() ? dto.notes.trim() : null;

    if (beatPreviousLeader) {
      await this.entriesRepo.update(
        { celebrationPending: true },
        { celebrationPending: false },
      );
    }

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
      }),
    );

    const rank = await this.getRankForEntry(saved);

    return {
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
  }

  private async getTopEntry(
    exercise: EventExercise,
    gender: EventGender,
  ): Promise<EventEntryEntity | null> {
    return await this.entriesRepo.findOne({
      where: { exercise, gender },
      order: { reps: 'DESC', createdAt: 'ASC' },
    });
  }

  private async getTopRows(
    exercise: EventExercise,
    gender: EventGender,
    limit: number,
  ): Promise<EventLeaderboardRow[]> {
    const entries = await this.entriesRepo.find({
      where: { exercise, gender },
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
      .andWhere(
        `(entry.reps > :reps OR (entry.reps = :reps AND entry.createdAt < :createdAt))`,
        { reps: entry.reps, createdAt: entry.createdAt },
      )
      .getCount();

    return betterCount + 1;
  }
}
