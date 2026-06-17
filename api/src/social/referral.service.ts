import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { FriendshipStatus } from './entities/friendship-status.enum.js';
import { InvitesService } from './invites.service.js';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
    private readonly invitesService: InvitesService,
    @Inject(forwardRef(() => NotificationDispatchService))
    private readonly notifications: NotificationDispatchService,
  ) {}

  async applyReferralCode(
    userId: string,
    code: string,
  ): Promise<{ ok: true; referrerUserId: string }> {
    const inviterProfile =
      await this.invitesService.findInviterProfileByCode(code);
    if (!inviterProfile) {
      throw new NotFoundException('Code de parrainage introuvable');
    }
    if (inviterProfile.userId === userId) {
      throw new BadRequestException('Tu ne peux pas utiliser ton propre code');
    }

    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profil introuvable');
    }
    if (profile.referredByUserId) {
      throw new ConflictException('Tu as déjà utilisé un code de parrainage');
    }

    await this.profilesRepo.update(
      { userId },
      { referredByUserId: inviterProfile.userId },
    );

    await this.ensureAcceptedFriendship(inviterProfile.userId, userId);

    return { ok: true, referrerUserId: inviterProfile.userId };
  }

  async requestFromInvite(userId: string, inviteCode: string) {
    const { referrerUserId } = await this.applyReferralCode(userId, inviteCode);
    const friendship = await this.friendshipsRepo.findOne({
      where: {
        requesterId: referrerUserId,
        addresseeId: userId,
      },
    });
    if (!friendship) {
      throw new NotFoundException('Relation introuvable');
    }
    return { friendshipId: friendship.id, status: friendship.status };
  }

  async applyReferralCodeOnSignup(params: {
    newUserId: string;
    inviteCode?: string | null;
  }): Promise<void> {
    if (!params.inviteCode?.trim()) return;

    try {
      await this.applyReferralCode(params.newUserId, params.inviteCode);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        return;
      }
      throw error;
    }
  }

  private async ensureAcceptedFriendship(
    requesterId: string,
    addresseeId: string,
  ) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Tu ne peux pas t’inviter toi-même');
    }

    const existing = await this.friendshipsRepo.findOne({
      where: {
        requesterId,
        addresseeId,
      },
    });
    if (existing) {
      if (existing.status === FriendshipStatus.PENDING) {
        existing.status = FriendshipStatus.ACCEPTED;
        await this.friendshipsRepo.save(existing);
        void this.notifications.notifyFriendAccepted({
          requesterId,
          addresseeId,
          friendshipId: existing.id,
        });
      }
      return { friendshipId: existing.id, status: existing.status };
    }

    const created = await this.friendshipsRepo.save({
      requesterId,
      addresseeId,
      status: FriendshipStatus.ACCEPTED,
    });
    void this.notifications.notifyFriendAccepted({
      requesterId,
      addresseeId,
      friendshipId: created.id,
    });
    return { friendshipId: created.id, status: created.status };
  }
}
