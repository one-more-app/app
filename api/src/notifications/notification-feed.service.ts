import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import type { PushPayload } from './dto/push-payload.dto.js';
import type {
  NotificationFeedAnalyticsDto,
  NotificationFeedItemDto,
  NotificationFeedResponseDto,
} from './dto/notification-feed.dto.js';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity.js';
import { compactPushAnalytics } from './push-analytics.js';

export type RecordResult = {
  created: boolean;
  entity: NotificationDeliveryEntity;
};

@Injectable()
export class NotificationFeedService {
  constructor(
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveriesRepo: Repository<NotificationDeliveryEntity>,
  ) {}

  private analyticsFromEntity(
    raw: Record<string, string> | null | undefined,
  ): NotificationFeedAnalyticsDto | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const dto: NotificationFeedAnalyticsDto = {};
    if (raw.templateKey) dto.templateKey = raw.templateKey;
    if (raw.campaignKey) dto.campaignKey = raw.campaignKey;
    if (raw.segmentKey) dto.segmentKey = raw.segmentKey;
    if (raw.outboundMessageId) dto.outboundMessageId = raw.outboundMessageId;
    return Object.keys(dto).length > 0 ? dto : undefined;
  }

  private analyticsToStorage(payload: PushPayload): Record<string, string> {
    const compact = compactPushAnalytics(payload.analytics);
    if (!compact) return {};
    const stored: Record<string, string> = {};
    if (compact.templateKey) stored.templateKey = compact.templateKey;
    if (compact.campaignKey) stored.campaignKey = compact.campaignKey;
    if (compact.segmentKey) stored.segmentKey = compact.segmentKey;
    if (compact.outboundMessageId) {
      stored.outboundMessageId = compact.outboundMessageId;
    }
    return stored;
  }

  private toItem(entity: NotificationDeliveryEntity): NotificationFeedItemDto {
    const analytics = this.analyticsFromEntity(entity.analytics);
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title ?? '',
      body: entity.body ?? '',
      route: entity.route,
      sentAt: entity.sentAt.toISOString(),
      readAt: entity.readAt ? entity.readAt.toISOString() : null,
      ...(analytics ? { analytics } : {}),
    };
  }

  async record(userId: string, payload: PushPayload): Promise<RecordResult> {
    try {
      const entity = await this.deliveriesRepo.save(
        this.deliveriesRepo.create({
          userId,
          type: payload.type,
          dedupKey: payload.dedupKey,
          sentAt: new Date(),
          title: payload.title,
          body: payload.body,
          route: payload.route,
          readAt: null,
          analytics: this.analyticsToStorage(payload),
        }),
      );
      return { created: true, entity };
    } catch {
      const existing = await this.deliveriesRepo.findOne({
        where: {
          userId,
          type: payload.type,
          dedupKey: payload.dedupKey,
        },
      });
      if (existing) {
        return { created: false, entity: existing };
      }
      throw new Error(
        `Failed to record notification ${payload.type}:${payload.dedupKey}`,
      );
    }
  }

  async unreadCount(userId: string): Promise<number> {
    return await this.deliveriesRepo.count({
      where: {
        userId,
        readAt: IsNull(),
        title: Not(IsNull()),
      },
    });
  }

  async list(
    userId: string,
    opts?: { limit?: number },
  ): Promise<NotificationFeedResponseDto> {
    const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 100);
    const items = await this.deliveriesRepo.find({
      where: {
        userId,
        title: Not(IsNull()),
      },
      order: { sentAt: 'DESC' },
      take: limit,
    });
    const unreadCount = await this.unreadCount(userId);
    return {
      items: items.map((row) => this.toItem(row)),
      unreadCount,
    };
  }

  async markRead(
    userId: string,
    ids?: string[],
  ): Promise<{ unreadCount: number }> {
    const now = new Date();
    if (ids && ids.length > 0) {
      await this.deliveriesRepo.update(
        {
          userId,
          id: In(ids),
          readAt: IsNull(),
        },
        { readAt: now },
      );
    } else {
      await this.deliveriesRepo.update(
        {
          userId,
          readAt: IsNull(),
        },
        { readAt: now },
      );
    }
    return { unreadCount: await this.unreadCount(userId) };
  }
}
