import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FriendsService } from '../social/friends.service.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { PresenceStatus } from './entities/presence-status.enum.js';
import { UserPresenceEntity } from './entities/user-presence.entity.js';

const STALE_MS = 90_000;

export type PresenceDto = {
  userId: string;
  status: PresenceStatus;
  exerciseName: string | null;
  trackedExerciseId: string | null;
  gifUrl: string | null;
  isCustom: boolean | null;
  bodyPart: string | null;
  target: string | null;
  equipment: string | null;
  lastHeartbeatAt: string;
};

type PresenceExerciseMedia = {
  gifUrl: string | null;
  isCustom: boolean | null;
  bodyPart: string | null;
  target: string | null;
  equipment: string | null;
};

const EMPTY_MEDIA: PresenceExerciseMedia = {
  gifUrl: null,
  isCustom: null,
  bodyPart: null,
  target: null,
  equipment: null,
};

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(UserPresenceEntity)
    private readonly presenceRepo: Repository<UserPresenceEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
    @Inject(forwardRef(() => FriendsService))
    private readonly friendsService: FriendsService,
  ) {}

  private resolveEffectiveStatus(row: UserPresenceEntity): PresenceStatus {
    const age = Date.now() - row.lastHeartbeatAt.getTime();
    if (age > STALE_MS) return PresenceStatus.OFFLINE;
    return row.status;
  }

  private toBaseDto(row: UserPresenceEntity): Omit<
    PresenceDto,
    keyof PresenceExerciseMedia
  > {
    const status = this.resolveEffectiveStatus(row);
    return {
      userId: row.userId,
      status,
      exerciseName:
        status === PresenceStatus.TRAINING ? row.exerciseName : null,
      trackedExerciseId:
        status === PresenceStatus.TRAINING ? row.trackedExerciseId : null,
      lastHeartbeatAt: row.lastHeartbeatAt.toISOString(),
    };
  }

  private mediaFromTracked(
    ex: TrackedExerciseEntity | undefined,
  ): PresenceExerciseMedia {
    if (!ex) return EMPTY_MEDIA;
    return {
      gifUrl: ex.gifUrl,
      isCustom: ex.isCustom,
      bodyPart: ex.bodyPart,
      target: ex.target,
      equipment: ex.equipment,
    };
  }

  private async loadMediaForPairs(
    pairs: { userId: string; clientId: string }[],
  ): Promise<Map<string, TrackedExerciseEntity>> {
    const unique = new Map<string, { userId: string; clientId: string }>();
    for (const pair of pairs) {
      unique.set(`${pair.userId}:${pair.clientId}`, pair);
    }
    const list = [...unique.values()];
    if (list.length === 0) return new Map();

    const qb = this.trackedRepo.createQueryBuilder('t');
    list.forEach((pair, index) => {
      const clause = `(t.userId = :userId${index} AND t.clientId = :clientId${index})`;
      if (index === 0) qb.where(clause);
      else qb.orWhere(clause);
      qb.setParameter(`userId${index}`, pair.userId);
      qb.setParameter(`clientId${index}`, pair.clientId);
    });

    const rows = await qb.getMany();
    return new Map(rows.map((row) => [`${row.userId}:${row.clientId}`, row]));
  }

  private async enrichWithMedia(
    bases: Omit<PresenceDto, keyof PresenceExerciseMedia>[],
  ): Promise<PresenceDto[]> {
    const pairs = bases
      .filter(
        (dto) =>
          dto.status === PresenceStatus.TRAINING && dto.trackedExerciseId,
      )
      .map((dto) => ({
        userId: dto.userId,
        clientId: dto.trackedExerciseId!,
      }));
    const byKey = await this.loadMediaForPairs(pairs);

    return bases.map((dto) => {
      if (
        dto.status !== PresenceStatus.TRAINING ||
        !dto.trackedExerciseId
      ) {
        return { ...dto, ...EMPTY_MEDIA };
      }
      const ex = byKey.get(`${dto.userId}:${dto.trackedExerciseId}`);
      return { ...dto, ...this.mediaFromTracked(ex) };
    });
  }

  private async toDto(row: UserPresenceEntity): Promise<PresenceDto> {
    const [enriched] = await this.enrichWithMedia([this.toBaseDto(row)]);
    return enriched;
  }

  async updateHeartbeat(
    userId: string,
    payload: {
      status: PresenceStatus;
      exerciseName?: string;
      trackedExerciseId?: string;
    },
  ): Promise<PresenceDto> {
    const now = new Date();
    const status =
      payload.status === PresenceStatus.TRAINING
        ? PresenceStatus.TRAINING
        : payload.status === PresenceStatus.ONLINE
          ? PresenceStatus.ONLINE
          : PresenceStatus.OFFLINE;

    await this.presenceRepo.upsert(
      {
        userId,
        status,
        exerciseName:
          status === PresenceStatus.TRAINING
            ? (payload.exerciseName ?? null)
            : null,
        trackedExerciseId:
          status === PresenceStatus.TRAINING
            ? (payload.trackedExerciseId ?? null)
            : null,
        lastHeartbeatAt: now,
      },
      ['userId'],
    );

    const saved = await this.presenceRepo.findOneOrFail({ where: { userId } });
    return this.toDto(saved);
  }

  async getFriendsPresence(viewerId: string): Promise<PresenceDto[]> {
    const friendIds = await this.friendsService.getAcceptedFriendIds(viewerId);
    if (friendIds.length === 0) return [];

    const rows = await this.presenceRepo.find({
      where: { userId: In(friendIds) },
    });
    const byUser = new Map(rows.map((r) => [r.userId, r]));

    const bases = friendIds.map((id) => {
      const row = byUser.get(id);
      if (!row) {
        return {
          userId: id,
          status: PresenceStatus.OFFLINE,
          exerciseName: null,
          trackedExerciseId: null,
          lastHeartbeatAt: new Date(0).toISOString(),
        };
      }
      return this.toBaseDto(row);
    });

    return this.enrichWithMedia(bases);
  }

  async getPresence(userId: string): Promise<PresenceDto | null> {
    const row = await this.presenceRepo.findOne({ where: { userId } });
    if (!row) return null;
    return this.toDto(row);
  }
}
