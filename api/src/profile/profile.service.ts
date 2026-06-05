import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  assertValidUsername,
  normalizeUsername,
  suggestUsernameFromProfile,
} from '../social/lib/username.js';
import { UsernameService } from '../social/username.service.js';
import { UserProfileEntity } from './user-profile.entity.js';
import type { UpsertProfileDto } from './profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    private readonly usernameService: UsernameService,
  ) {}

  async getProfile(userId: string) {
    await this.usernameService.ensureUsername(userId);
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) return null;
    return this.toProfileDto(profile);
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string) {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      return { available: false, username: '', reason: 'empty' as const };
    }
    try {
      assertValidUsername(normalized);
    } catch {
      return { available: false, username: normalized, reason: 'invalid' as const };
    }
    const available = await this.usernameService.isAvailable(
      normalized,
      excludeUserId,
    );
    return { available, username: normalized, reason: available ? null : ('taken' as const) };
  }

  async suggestAvailableUsername(params: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    const suggested = suggestUsernameFromProfile({
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      email: params.email ?? null,
    });
    const available = await this.usernameService.generateUniqueUsername({
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      email: params.email ?? null,
    });
    return { suggested, available };
  }

  private toProfileDto(profile: UserProfileEntity) {
    return {
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      gender: profile.gender,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      username: profile.username,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async upsertProfile(userId: string, body: UpsertProfileDto) {
    const payload: Partial<UserProfileEntity> & { userId: string } = {
      userId,
      weightKg: body.weightKg,
      heightCm: body.heightCm,
      gender: body.gender,
    };
    if (body.firstName !== undefined) {
      payload.firstName = body.firstName ?? null;
    }
    if (body.lastName !== undefined) {
      payload.lastName = body.lastName ?? null;
    }
    if (body.avatarUrl !== undefined) {
      payload.avatarUrl = body.avatarUrl;
    }
    await this.profilesRepo.upsert(payload, ['userId']);
    const profile = await this.profilesRepo.findOneOrFail({ where: { userId } });
    return this.toProfileDto(profile);
  }
}
