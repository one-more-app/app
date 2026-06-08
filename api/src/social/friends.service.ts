import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LeagueService } from '../league/league.service.js';
import { PerformanceEntriesService } from '../performance/performance-entries.service.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { ProgressService } from '../progress/progress.service.js';
import { TrackedExercisesService } from '../tracked-exercises/tracked-exercises.service.js';
import { AccessService } from './access.service.js';
import { InvitesService } from './invites.service.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { FriendshipStatus } from './entities/friendship-status.enum.js';

type FriendListItem = {
  friendshipId: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  status: FriendshipStatus;
  direction: 'incoming' | 'outgoing' | 'friend';
};

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    private readonly accessService: AccessService,
    private readonly invitesService: InvitesService,
    private readonly progressService: ProgressService,
    private readonly trackedExercisesService: TrackedExercisesService,
    private readonly performanceEntriesService: PerformanceEntriesService,
    private readonly leagueService: LeagueService,
  ) {}

  async listFriends(userId: string) {
    const friendships = await this.friendshipsRepo.find({
      where: [{ requesterId: userId }, { addresseeId: userId }],
      order: { updatedAt: 'DESC' },
    });

    const otherUserIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );
    const profiles =
      otherUserIds.length === 0
        ? []
        : await this.profilesRepo.find({
            where: { userId: In(otherUserIds) },
          });
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

    const items: FriendListItem[] = friendships.map((f) => {
      const otherUserId =
        f.requesterId === userId ? f.addresseeId : f.requesterId;
      const profile = profileByUserId.get(otherUserId);
      const direction: FriendListItem['direction'] =
        f.status === FriendshipStatus.ACCEPTED
          ? 'friend'
          : f.requesterId === userId
            ? 'outgoing'
            : 'incoming';

      return {
        friendshipId: f.id,
        userId: otherUserId,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        status: f.status,
        direction,
      };
    });

    return {
      friends: items.filter((i) => i.status === FriendshipStatus.ACCEPTED),
      pendingIncoming: items.filter(
        (i) =>
          i.status === FriendshipStatus.PENDING && i.direction === 'incoming',
      ),
      pendingOutgoing: items.filter(
        (i) =>
          i.status === FriendshipStatus.PENDING && i.direction === 'outgoing',
      ),
    };
  }

  async getFriendshipBetween(userId: string, otherUserId: string) {
    return await this.friendshipsRepo.findOne({
      where: [
        { requesterId: userId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: userId },
      ],
    });
  }

  async assertAcceptedFriends(userId: string, otherUserId: string) {
    const friendship = await this.friendshipsRepo.findOne({
      where: [
        {
          requesterId: userId,
          addresseeId: otherUserId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requesterId: otherUserId,
          addresseeId: userId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });
    if (!friendship) {
      throw new ForbiddenException('Vous devez être amis pour cette action');
    }
    return friendship;
  }

  async getAcceptedFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.friendshipsRepo.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });
    return friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );
  }

  async requestFriend(requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) {
      throw new BadRequestException('Tu ne peux pas t’ajouter toi-même');
    }

    const targetProfile = await this.profilesRepo.findOne({
      where: { userId: targetUserId },
    });
    if (!targetProfile) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const existing = await this.getFriendshipBetween(requesterId, targetUserId);
    if (existing) {
      return { friendshipId: existing.id, status: existing.status };
    }

    const created = await this.friendshipsRepo.save({
      requesterId,
      addresseeId: targetUserId,
      status: FriendshipStatus.PENDING,
    });
    return { friendshipId: created.id, status: created.status };
  }

  async cancelOutgoingRequest(userId: string, friendshipId: string) {
    const friendship = await this.friendshipsRepo.findOne({
      where: { id: friendshipId },
    });
    if (!friendship) throw new NotFoundException('Demande introuvable');
    if (friendship.requesterId !== userId) {
      throw new ForbiddenException('Tu ne peux pas annuler cette demande');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Demande déjà traitée');
    }
    await this.friendshipsRepo.remove(friendship);
    return { ok: true };
  }

  async getUserPreview(viewerId: string, targetUserId: string) {
    if (viewerId === targetUserId) {
      throw new BadRequestException('Profil personnel');
    }

    const profile = await this.profilesRepo.findOne({
      where: { userId: targetUserId },
    });
    if (!profile) throw new NotFoundException('Profil introuvable');

    const friendship = await this.getFriendshipBetween(viewerId, targetUserId);
    const progress = await this.progressService.getProgress(targetUserId);

    return {
      userId: targetUserId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      level: progress.level,
      streakCurrent: progress.streak.current,
      friendshipStatus: friendship?.status ?? null,
      friendshipId: friendship?.id ?? null,
      friendshipDirection:
        friendship == null
          ? null
          : friendship.requesterId === viewerId
            ? 'outgoing'
            : 'incoming',
    };
  }

  async requestFromInvite(userId: string, inviteCode: string) {
    const inviterProfile =
      await this.invitesService.findInviterProfileByCode(inviteCode);
    if (!inviterProfile) {
      throw new NotFoundException('Invitation introuvable');
    }
    if (inviterProfile.userId === userId) {
      throw new BadRequestException('Tu ne peux pas t’inviter toi-même');
    }

    const existing = await this.friendshipsRepo.findOne({
      where: {
        requesterId: inviterProfile.userId,
        addresseeId: userId,
      },
    });
    if (existing) {
      if (existing.status === FriendshipStatus.PENDING) {
        existing.status = FriendshipStatus.ACCEPTED;
        await this.friendshipsRepo.save(existing);
        await this.accessService.unlockInviter(inviterProfile.userId);
      }
      return { friendshipId: existing.id, status: existing.status };
    }

    const created = await this.friendshipsRepo.save({
      requesterId: inviterProfile.userId,
      addresseeId: userId,
      status: FriendshipStatus.ACCEPTED,
    });
    await this.accessService.unlockInviter(inviterProfile.userId);
    return { friendshipId: created.id, status: created.status };
  }

  async accept(userId: string, friendshipId: string) {
    const friendship = await this.friendshipsRepo.findOne({
      where: { id: friendshipId },
    });
    if (!friendship) throw new NotFoundException('Demande introuvable');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('Tu ne peux pas accepter cette demande');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Demande déjà traitée');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    await this.friendshipsRepo.save(friendship);
    await this.accessService.unlockInviter(friendship.requesterId);

    return { ok: true, friendshipId: friendship.id };
  }

  async decline(userId: string, friendshipId: string) {
    const friendship = await this.friendshipsRepo.findOne({
      where: { id: friendshipId },
    });
    if (!friendship) throw new NotFoundException('Demande introuvable');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('Tu ne peux pas refuser cette demande');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Demande déjà traitée');
    }

    friendship.status = FriendshipStatus.DECLINED;
    await this.friendshipsRepo.save(friendship);
    return { ok: true };
  }

  async remove(userId: string, otherUserId: string) {
    const friendship = await this.friendshipsRepo.findOne({
      where: [
        { requesterId: userId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: userId },
      ],
    });
    if (!friendship) throw new NotFoundException('Relation introuvable');
    await this.friendshipsRepo.remove(friendship);
    return { ok: true };
  }

  async getFriendProfile(viewerId: string, friendUserId: string) {
    const friendship = await this.friendshipsRepo.findOne({
      where: [
        {
          requesterId: viewerId,
          addresseeId: friendUserId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requesterId: friendUserId,
          addresseeId: viewerId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });
    if (!friendship) {
      throw new ForbiddenException('Profil non accessible');
    }

    const profile = await this.profilesRepo.findOne({
      where: { userId: friendUserId },
    });
    if (!profile) throw new NotFoundException('Profil introuvable');

    const [progress, exercises, performanceEntries, leagueSummary] =
      await Promise.all([
        this.progressService.getProgress(friendUserId),
        this.trackedExercisesService.listWithPerformance(friendUserId),
        this.performanceEntriesService.list(friendUserId),
        this.leagueService.buildSummary(friendUserId),
      ]);

    return {
      userId: friendUserId,
      profile: {
        weightKg: profile.weightKg ?? 75,
        heightCm: profile.heightCm ?? 175,
        gender: profile.gender === 'female' ? 'female' : 'male',
        firstName: profile.firstName ?? undefined,
        lastName: profile.lastName ?? undefined,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      },
      progress,
      exercises,
      performanceEntries,
      leagueSummary,
    };
  }
}
