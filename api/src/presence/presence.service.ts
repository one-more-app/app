import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FriendsService } from '../social/friends.service.js';
import { PresenceStatus } from './entities/presence-status.enum.js';
import { UserPresenceEntity } from './entities/user-presence.entity.js';

const STALE_MS = 90_000;

export type PresenceDto = {
  userId: string;
  status: PresenceStatus;
  exerciseName: string | null;
  trackedExerciseId: string | null;
  lastHeartbeatAt: string;
};

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(UserPresenceEntity)
    private readonly presenceRepo: Repository<UserPresenceEntity>,
    private readonly friendsService: FriendsService,
  ) {}

  private resolveEffectiveStatus(row: UserPresenceEntity): PresenceStatus {
    const age = Date.now() - row.lastHeartbeatAt.getTime();
    if (age > STALE_MS) return PresenceStatus.OFFLINE;
    return row.status;
  }

  private toDto(row: UserPresenceEntity): PresenceDto {
    const status = this.resolveEffectiveStatus(row);
    return {
      userId: row.userId,
      status,
      exerciseName: status === PresenceStatus.TRAINING ? row.exerciseName : null,
      trackedExerciseId:
        status === PresenceStatus.TRAINING ? row.trackedExerciseId : null,
      lastHeartbeatAt: row.lastHeartbeatAt.toISOString(),
    };
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
    let row = await this.presenceRepo.findOne({ where: { userId } });
    if (!row) {
      row = this.presenceRepo.create({
        userId,
        status: PresenceStatus.OFFLINE,
        exerciseName: null,
        trackedExerciseId: null,
        lastHeartbeatAt: now,
      });
    }

    row.status =
      payload.status === PresenceStatus.TRAINING
        ? PresenceStatus.TRAINING
        : payload.status === PresenceStatus.ONLINE
          ? PresenceStatus.ONLINE
          : PresenceStatus.OFFLINE;
    row.exerciseName =
      row.status === PresenceStatus.TRAINING
        ? (payload.exerciseName ?? null)
        : null;
    row.trackedExerciseId =
      row.status === PresenceStatus.TRAINING
        ? (payload.trackedExerciseId ?? null)
        : null;
    row.lastHeartbeatAt = now;

    const saved = await this.presenceRepo.save(row);
    return this.toDto(saved);
  }

  async getFriendsPresence(viewerId: string): Promise<PresenceDto[]> {
    const friendIds = await this.friendsService.getAcceptedFriendIds(viewerId);
    if (friendIds.length === 0) return [];

    const rows = await this.presenceRepo.find({
      where: { userId: In(friendIds) },
    });
    const byUser = new Map(rows.map((r) => [r.userId, r]));

    return friendIds.map((id) => {
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
      return this.toDto(row);
    });
  }

  async getPresence(userId: string): Promise<PresenceDto | null> {
    const row = await this.presenceRepo.findOne({ where: { userId } });
    if (!row) return null;
    return this.toDto(row);
  }
}
