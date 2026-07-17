import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { FriendshipStatus } from '../social/entities/friendship-status.enum.js';
import { getAcceptedFriendIds } from '../social/lib/accepted-friend-ids.js';
import { FriendTrainingAlertEntity } from './entities/friend-training-alert.entity.js';

/**
 * Alertes « ami s'entraîne » : actives par défaut pour chaque ami accepté.
 * Une ligne dans `friend_training_alerts` signifie un mute (opt-out).
 */
@Injectable()
export class FriendTrainingAlertsService {
  constructor(
    @InjectRepository(FriendTrainingAlertEntity)
    private readonly repo: Repository<FriendTrainingAlertEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
  ) {}

  private async assertAcceptedFriends(userId: string, friendId: string) {
    const friendship = await this.friendshipsRepo.findOne({
      where: [
        {
          requesterId: userId,
          addresseeId: friendId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requesterId: friendId,
          addresseeId: userId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });
    if (!friendship) {
      throw new ForbiddenException('Ami requis pour cet abonnement');
    }
  }

  /** Friend IDs for which the user has muted training alerts. */
  async listMutedFriendIds(subscriberId: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { subscriberId } });
    return rows.map((r) => r.friendId);
  }

  async isMuted(subscriberId: string, friendId: string): Promise<boolean> {
    const row = await this.repo.findOne({ where: { subscriberId, friendId } });
    return !!row;
  }

  async isSubscribed(subscriberId: string, friendId: string): Promise<boolean> {
    return !(await this.isMuted(subscriberId, friendId));
  }

  /** Enable alerts (remove mute). Default state: already enabled. */
  async subscribe(subscriberId: string, friendId: string) {
    if (subscriberId === friendId) {
      throw new BadRequestException('Abonnement invalide');
    }
    await this.assertAcceptedFriends(subscriberId, friendId);
    await this.repo.delete({ subscriberId, friendId });
    return { ok: true, friendId };
  }

  /** Disable alerts for this friend (insert mute). */
  async unsubscribe(subscriberId: string, friendId: string) {
    if (subscriberId === friendId) {
      throw new BadRequestException('Abonnement invalide');
    }
    await this.assertAcceptedFriends(subscriberId, friendId);
    await this.repo.upsert({ subscriberId, friendId }, [
      'subscriberId',
      'friendId',
    ]);
    return { ok: true };
  }

  /** Accepted friends of `friendId` who have not muted training alerts. */
  async listSubscribersForFriend(friendId: string): Promise<string[]> {
    const friendIds = await getAcceptedFriendIds(
      this.friendshipsRepo,
      friendId,
    );
    if (friendIds.length === 0) return [];

    const mutes = await this.repo.find({ where: { friendId } });
    const mutedSubscriberIds = new Set(mutes.map((r) => r.subscriberId));
    return friendIds.filter((id) => !mutedSubscriberIds.has(id));
  }
}
