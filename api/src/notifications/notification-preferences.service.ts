import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NotificationPreferencesDto } from './dto/notification-preferences.dto.js';
import type { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto.js';
import { NotificationPreferencesEntity } from './entities/notification-preferences.entity.js';
import { NotificationType } from './entities/notification-type.enum.js';
import {
  normalizeReminderSlots,
  resolveReminderSlots,
  type ReminderSlot,
} from './lib/reminder-slots.js';

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(NotificationPreferencesEntity)
    private readonly repo: Repository<NotificationPreferencesEntity>,
  ) {}

  private syncLegacyColumns(slots: ReminderSlot[]): {
    reminderWeekdays: number[];
    reminderHour: number;
    reminderMinute: number;
  } {
    return {
      reminderWeekdays: slots.map((slot) => slot.weekday),
      reminderHour: slots[0]?.hour ?? 18,
      reminderMinute: slots[0]?.minute ?? 0,
    };
  }

  private toDto(
    entity: NotificationPreferencesEntity,
  ): NotificationPreferencesDto {
    const reminderSlots = resolveReminderSlots(entity);
    const legacy = this.syncLegacyColumns(reminderSlots);
    return {
      streakReminders: entity.streakReminders,
      friendRequests: entity.friendRequests,
      friendAccepted: entity.friendAccepted,
      messages: entity.messages,
      sessionComments: entity.sessionComments,
      friendTraining: entity.friendTraining,
      friendRecords: entity.friendRecords,
      weeklyRecap: entity.weeklyRecap,
      reminderSlots,
      ...legacy,
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
    const { reminderSlots, reminderWeekdays, reminderHour, reminderMinute, ...rest } =
      patch;
    const row = await this.repo.findOne({ where: { userId } });
    const entity =
      row ??
      (await this.repo.save(
        this.repo.create({
          userId,
          ...rest,
        }),
      ));
    if (row) {
      Object.assign(entity, rest);
    }

    const hasSlotPatch =
      reminderSlots !== undefined ||
      reminderWeekdays !== undefined ||
      reminderHour !== undefined ||
      reminderMinute !== undefined;
    if (hasSlotPatch) {
      const nextSlots =
        reminderSlots !== undefined
          ? normalizeReminderSlots(reminderSlots)
          : resolveReminderSlots({
              reminderSlots: entity.reminderSlots,
              reminderWeekdays: reminderWeekdays ?? entity.reminderWeekdays,
              reminderHour: reminderHour ?? entity.reminderHour,
              reminderMinute: reminderMinute ?? entity.reminderMinute,
            });
      const legacy = this.syncLegacyColumns(nextSlots);
      Object.assign(entity, { reminderSlots: nextSlots, ...legacy });
    }

    await this.repo.save(entity);
    return this.toDto(entity);
  }

  async listUserIdsDueForTrainingReminder(
    hour: number,
    minute: number,
    weekday: number,
  ): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('p')
      .select('p.userId', 'userId')
      .where('p.streakReminders = true')
      .andWhere(
        `EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p."reminderSlots") AS slot
          WHERE (slot->>'weekday')::int = :weekday
            AND (slot->>'hour')::int = :hour
            AND (slot->>'minute')::int = :minute
        )`,
        { weekday, hour, minute },
      )
      .getRawMany<{ userId: string }>();
    return rows.map((row) => row.userId);
  }

  async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const prefs = await this.getOrCreate(userId);
    switch (type) {
      case NotificationType.StreakAtRisk:
      case NotificationType.TrainingReminder:
        return prefs.streakReminders;
      case NotificationType.FriendRequest:
        return prefs.friendRequests;
      case NotificationType.FriendAccepted:
        return prefs.friendAccepted;
      case NotificationType.MessageNew:
        return prefs.messages;
      case NotificationType.SessionComment:
        return prefs.sessionComments;
      case NotificationType.FriendTraining:
        return prefs.friendTraining;
      case NotificationType.FriendPr:
        return prefs.friendRecords;
      case NotificationType.WeeklyRecap:
        return prefs.weeklyRecap;
      case NotificationType.ReferralUsed:
        return prefs.friendAccepted;
      case NotificationType.TshirtRewardUnlocked:
        return prefs.friendAccepted;
      default:
        return false;
    }
  }
}
