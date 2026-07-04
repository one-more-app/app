import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { FriendshipStatus } from '../social/entities/friendship-status.enum.js';
import { FriendTrainingAlertEntity } from './entities/friend-training-alert.entity.js';

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

  async listFriendIds(subscriberId: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { subscriberId } });
    return rows.map((r) => r.friendId);
  }

  async isSubscribed(subscriberId: string, friendId: string): Promise<boolean> {
    const row = await this.repo.findOne({ where: { subscriberId, friendId } });
    return !!row;
  }

  async subscribe(subscriberId: string, friendId: string) {
    if (subscriberId === friendId) {
      throw new BadRequestException('Abonnement invalide');
    }
    await this.assertAcceptedFriends(subscriberId, friendId);
    await this.repo.upsert({ subscriberId, friendId }, [
      'subscriberId',
      'friendId',
    ]);
    return { ok: true, friendId };
  }

  async unsubscribe(subscriberId: string, friendId: string) {
    await this.repo.delete({ subscriberId, friendId });
    return { ok: true };
  }

  async listSubscribersForFriend(friendId: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { friendId } });
    return rows.map((r) => r.subscriberId);
  }
}
