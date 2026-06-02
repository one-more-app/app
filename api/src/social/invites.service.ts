import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { FriendshipEntity } from './entities/friendship.entity.js';
import { FriendshipStatus } from './entities/friendship-status.enum.js';
import { AccessTier } from './entities/access-tier.enum.js';
import {
  buildInviteUrl,
  generateInviteCode,
} from './lib/invite-code.js';
import { UsernameService } from './username.service.js';

export type CreateProfileParams = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
};

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipsRepo: Repository<FriendshipEntity>,
    private readonly usernameService: UsernameService,
  ) {}

  async ensureInviteCode(userId: string): Promise<string> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profil introuvable');
    if (profile.inviteCode) return profile.inviteCode;

    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = generateInviteCode();
      try {
        await this.profilesRepo.update({ userId }, { inviteCode });
        return inviteCode;
      } catch {
        // collision — retry
      }
    }
    throw new BadRequestException('Impossible de générer un code d’invitation');
  }

  async getInviteLink(userId: string) {
    const code = await this.ensureInviteCode(userId);
    return { code, url: buildInviteUrl(code) };
  }

  async getInvitePreview(code: string) {
    const normalized = code.trim().toLowerCase();
    const profile = await this.profilesRepo.findOne({
      where: { inviteCode: normalized },
    });
    if (!profile) throw new NotFoundException('Invitation introuvable');
    return {
      inviterUserId: profile.userId,
      firstName: profile.firstName,
      avatarUrl: profile.avatarUrl,
    };
  }

  async findInviterProfileByCode(code: string): Promise<UserProfileEntity | null> {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return null;
    return await this.profilesRepo.findOne({
      where: { inviteCode: normalized },
    });
  }

  async createDefaultProfile(userId: string, params?: CreateProfileParams) {
    const inviteCode = await this.generateUniqueInviteCode();
    const username = await this.usernameService.resolveUsernameForSignup({
      requestedUsername: params?.username,
      firstName: params?.firstName ?? null,
      lastName: params?.lastName ?? null,
      email: params?.email ?? null,
    });

    return await this.profilesRepo.save({
      userId,
      weightKg: 75,
      heightCm: 175,
      gender: 'male',
      accessTier: AccessTier.LIMITED,
      inviteCode,
      username,
      searchableByName: true,
      discoverableByUsername: true,
      firstName: params?.firstName ?? null,
      lastName: params?.lastName ?? null,
    });
  }

  async ensureUsername(userId: string): Promise<string> {
    return await this.usernameService.ensureUsername(userId);
  }

  async processInviteOnSignup(params: {
    newUserId: string;
    inviteCode?: string | null;
  }): Promise<void> {
    if (!params.inviteCode?.trim()) return;

    const inviterProfile = await this.findInviterProfileByCode(params.inviteCode);
    if (!inviterProfile) return;
    if (inviterProfile.userId === params.newUserId) return;

    const existing = await this.friendshipsRepo.findOne({
      where: {
        requesterId: inviterProfile.userId,
        addresseeId: params.newUserId,
      },
    });
    if (existing) return;

    await this.friendshipsRepo.save({
      requesterId: inviterProfile.userId,
      addresseeId: params.newUserId,
      status: FriendshipStatus.PENDING,
    });
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt++) {
      const inviteCode = generateInviteCode();
      const collision = await this.profilesRepo.findOne({
        where: { inviteCode },
        select: ['id'],
      });
      if (!collision) return inviteCode;
    }
    throw new BadRequestException('Impossible de générer un code d’invitation');
  }
}
