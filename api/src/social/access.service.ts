import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EXERCISE_LIMIT_LIMITED } from '../shared/access-config.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { FriendshipStatus } from './entities/friendship-status.enum.js';
import { AccessTier } from './entities/access-tier.enum.js';

export type UserAccessDto = {
  accessTier: AccessTier;
  exerciseLimit: number | null;
  activeExerciseCount: number;
  canAddExercise: boolean;
  validatedInvitesCount: number;
};

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(TrackedExerciseEntity)
    private readonly trackedRepo: Repository<TrackedExerciseEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
  ) {}

  async getAccess(userId: string): Promise<UserAccessDto> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    const accessTier = profile?.accessTier ?? AccessTier.LIMITED;
    const activeExerciseCount = await this.countActiveExercises(userId);
    const validatedInvitesCount = await this.countValidatedInvites(userId);
    const hasFullAccess = accessTier === AccessTier.FULL;
    const exerciseLimit = hasFullAccess ? null : EXERCISE_LIMIT_LIMITED;
    const canAddExercise =
      hasFullAccess || activeExerciseCount < EXERCISE_LIMIT_LIMITED;

    return {
      accessTier,
      exerciseLimit,
      activeExerciseCount,
      canAddExercise,
      validatedInvitesCount,
    };
  }

  async countActiveExercises(userId: string): Promise<number> {
    return await this.trackedRepo.count({
      where: { userId, deletedAt: IsNull() },
    });
  }

  async countValidatedInvites(userId: string): Promise<number> {
    return await this.friendshipsRepo.count({
      where: {
        requesterId: userId,
        status: FriendshipStatus.ACCEPTED,
      },
    });
  }

  async assertCanAddExercise(userId: string): Promise<void> {
    const access = await this.getAccess(userId);
    if (!access.canAddExercise) {
      throw new ForbiddenException({
        message: `Limite de ${EXERCISE_LIMIT_LIMITED} exercices atteinte. Invite un pote pour débloquer l'app complète.`,
        code: 'EXERCISE_LIMIT_REACHED',
        exerciseLimit: EXERCISE_LIMIT_LIMITED,
        activeExerciseCount: access.activeExerciseCount,
      });
    }
  }

  async isNewActiveExercise(
    userId: string,
    clientId: string,
  ): Promise<boolean> {
    const existing = await this.trackedRepo.findOne({
      where: { userId, clientId },
    });
    if (!existing) return true;
    return existing.deletedAt != null;
  }

  async unlockInviter(requesterId: string): Promise<void> {
    await this.profilesRepo.update(
      { userId: requesterId, accessTier: AccessTier.LIMITED },
      { accessTier: AccessTier.FULL },
    );
  }
}
