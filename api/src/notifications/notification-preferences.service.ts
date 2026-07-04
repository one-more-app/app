import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NotificationPreferencesDto } from './dto/notification-preferences.dto.js';
import type { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto.js';
import { NotificationPreferencesEntity } from './entities/notification-preferences.entity.js';
import type { NotificationType } from './entities/notification-type.enum.js';

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(NotificationPreferencesEntity)
    private readonly repo: Repository<NotificationPreferencesEntity>,
  ) {}

  private toDto(
    entity: NotificationPreferencesEntity,
  ): NotificationPreferencesDto {
    return {
      streakReminders: entity.streakReminders,
      friendRequests: entity.friendRequests,
      friendAccepted: entity.friendAccepted,
      messages: entity.messages,
      friendTraining: entity.friendTraining,
      friendRecords: entity.friendRecords,
      weeklyRecap: entity.weeklyRecap,
    };
  }

  async getOrCreate(userId: string): Promise<NotificationPreferencesDto> {
    let row = await this.repo.findOne({ where: { userId } });
    if (!row) {
      row = await this.repo.save(this.repo.create({ userId }));
    }
    return this.toDto(row);
  }

  async update(
    userId: string,
    patch: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const row = await this.repo.findOne({ where: { userId } });
    const entity =
      row ??
      (await this.repo.save(
        this.repo.create({
          userId,
          ...patch,
        }),
      ));
    if (row) {
      Object.assign(entity, patch);
      await this.repo.save(entity);
    }
    return this.toDto(entity);
  }

  async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const prefs = await this.getOrCreate(userId);
    switch (type) {
      case 'streak_at_risk':
        return prefs.streakReminders;
      case 'friend_request':
        return prefs.friendRequests;
      case 'friend_accepted':
        return prefs.friendAccepted;
      case 'message_new':
        return prefs.messages;
      case 'friend_training':
        return prefs.friendTraining;
      case 'friend_pr':
        return prefs.friendRecords;
      case 'weekly_recap':
        return prefs.weeklyRecap;
      case 'referral_used':
        return prefs.friendAccepted;
      default:
        return false;
    }
  }
}
