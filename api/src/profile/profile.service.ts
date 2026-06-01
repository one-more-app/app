import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from './user-profile.entity.js';
import type { UpsertProfileDto } from './profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) return null;
    return {
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      gender: profile.gender,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async upsertProfile(userId: string, body: UpsertProfileDto) {
    const payload: Partial<UserProfileEntity> & { userId: string } = {
      userId,
      weightKg: body.weightKg,
      heightCm: body.heightCm,
      gender: body.gender,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
    };
    if (body.avatarUrl !== undefined) {
      payload.avatarUrl = body.avatarUrl;
    }
    await this.profilesRepo.upsert(payload, ['userId']);
    const profile = await this.profilesRepo.findOneOrFail({ where: { userId } });
    return {
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      gender: profile.gender,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
