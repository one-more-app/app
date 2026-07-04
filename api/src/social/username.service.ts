import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import {
  assertValidUsername,
  buildUsernameCandidates,
  normalizeUsername,
} from './lib/username.js';

@Injectable()
export class UsernameService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async isAvailable(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const normalized = normalizeUsername(username);
    if (!normalized) return false;

    const qb = this.profilesRepo
      .createQueryBuilder('p')
      .where('LOWER(p.username) = :username', { username: normalized });

    if (excludeUserId) {
      qb.andWhere('p.userId != :excludeUserId', { excludeUserId });
    }

    const taken = await qb.getOne();
    return !taken;
  }

  async assertAvailable(
    username: string,
    excludeUserId?: string,
  ): Promise<string> {
    const normalized = normalizeUsername(username);
    assertValidUsername(normalized);
    if (!(await this.isAvailable(normalized, excludeUserId))) {
      throw new ConflictException('Ce pseudo est déjà pris');
    }
    return normalized;
  }

  async generateUniqueUsername(params: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  }): Promise<string> {
    const bases = buildUsernameCandidates(params);

    for (const base of bases) {
      if (await this.isAvailable(base)) return base;

      for (let i = 2; i <= 9999; i++) {
        const suffix = String(i);
        const candidate = `${base.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`;
        if (await this.isAvailable(candidate)) return candidate;
      }
    }

    for (let i = 0; i < 20; i++) {
      const fallback = `user_${Math.random().toString(36).slice(2, 8)}`;
      if (await this.isAvailable(fallback)) return fallback;
    }

    throw new ConflictException('Impossible de générer un pseudo unique');
  }

  /** Attribue un pseudo aux comptes existants qui n'en ont pas encore. */
  async ensureUsername(userId: string): Promise<string> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profil introuvable');

    if (profile.username?.trim()) {
      return profile.username;
    }

    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'email'],
    });

    const username = await this.generateUniqueUsername({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: user?.email ?? null,
    });

    profile.username = username;
    await this.profilesRepo.save(profile);
    return username;
  }

  async resolveUsernameForSignup(params: {
    requestedUsername?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  }): Promise<string> {
    if (params.requestedUsername?.trim()) {
      return await this.assertAvailable(params.requestedUsername);
    }
    return await this.generateUniqueUsername({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
    });
  }
}
