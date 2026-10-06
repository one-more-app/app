import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';
import { NotificationPreferencesService } from '../../notifications/notification-preferences.service.js';
import {
  EmailSuppressionEntity,
  type EmailSuppressionReason,
} from '../entities/email-suppression.entity.js';

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(EmailSuppressionEntity)
    private readonly suppressionsRepo: Repository<EmailSuppressionEntity>,
    private readonly notificationPrefs: NotificationPreferencesService,
  ) {}

  async isEmailMarketingAllowed(userId: string): Promise<boolean> {
    const prefs = await this.notificationPrefs.getOrCreate(userId);
    if (!prefs.marketingEmail) return false;

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user?.email?.trim()) return false;
    if (user.deletedAt) return false;

    const suppressed = await this.suppressionsRepo.findOne({
      where: { email: user.email.trim().toLowerCase() },
    });
    return !suppressed;
  }

  async findUserByUnsubscribeToken(token: string): Promise<UserEntity | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;
    return this.usersRepo.findOne({ where: { unsubscribeToken: trimmed } });
  }

  async unsubscribeByToken(token: string): Promise<UserEntity | null> {
    const user = await this.findUserByUnsubscribeToken(token);
    if (!user) return null;

    await this.notificationPrefs.update(user.id, { marketingEmail: false });

    if (user.email?.trim()) {
      await this.recordSuppression({
        email: user.email.trim().toLowerCase(),
        reason: 'unsubscribe',
        meta: { userId: user.id, source: 'unsubscribe_token' },
      });
    }

    return user;
  }

  async recordSuppression(params: {
    email: string;
    reason: EmailSuppressionReason;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const email = params.email.trim().toLowerCase();
    if (!email) return;

    const existing = await this.suppressionsRepo.findOne({ where: { email } });
    if (existing) {
      existing.reason = params.reason;
      existing.meta = params.meta ?? null;
      await this.suppressionsRepo.save(existing);
      return;
    }
    await this.suppressionsRepo.save(
      this.suppressionsRepo.create({
        email,
        reason: params.reason,
        meta: params.meta ?? null,
      }),
    );
  }

  async getUnsubscribeTokenForUser(userId: string): Promise<string | null> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    return user?.unsubscribeToken ?? null;
  }
}
