import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboundDispatchEntity } from '../entities/outbound-dispatch.entity.js';
import { SegmentRegistryService } from '../segments/segment-registry.service.js';
import { OutboundSendService } from './outbound-send.service.js';
import {
  isOutboundStagingRecipientOverrideActive,
  resolveDispatchRecipientIds,
} from './outbound-staging-recipients.js';

function maxRecipients(): number {
  const raw = process.env.OUTBOUND_MAX_RECIPIENTS?.trim() ?? '5000';
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 5000;
}

@Injectable()
export class OutboundDispatchService {
  private readonly logger = new Logger(OutboundDispatchService.name);

  constructor(
    @InjectRepository(OutboundDispatchEntity)
    private readonly dispatchRepo: Repository<OutboundDispatchEntity>,
    private readonly segments: SegmentRegistryService,
    private readonly send: OutboundSendService,
  ) {}

  async createDispatch(params: {
    segmentKey: string;
    params?: Record<string, unknown>;
    templateKey: string;
    channel?: 'email' | 'push' | 'auto';
    campaignKey?: string;
    idempotencyKey: string;
    confirmLargeAudience?: boolean;
  }): Promise<{ dispatchId: string; recipients: number }> {
    const existing = await this.dispatchRepo.findOne({
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing) {
      return {
        dispatchId: existing.id,
        recipients: existing.recipientCount,
      };
    }

    const segmentUserIds = await this.segments.resolveUserIds(
      params.segmentKey,
      params.params ?? {},
    );
    const userIds = resolveDispatchRecipientIds(segmentUserIds);
    if (isOutboundStagingRecipientOverrideActive()) {
      this.logger.log(
        `Staging recipient override: ${params.idempotencyKey} → ${userIds.length} user(s) (segment had ${segmentUserIds.length})`,
      );
    }

    const limit = maxRecipients();
    if (userIds.length > limit && !params.confirmLargeAudience) {
      throw new BadRequestException(
        `Audience trop large (${userIds.length}). Repasser confirmLargeAudience=true.`,
      );
    }

    const dispatch = await this.dispatchRepo.save(
      this.dispatchRepo.create({
        segmentKey: params.segmentKey,
        segmentParams: params.params ?? {},
        templateKey: params.templateKey,
        channel: params.channel ?? 'auto',
        campaignKey: params.campaignKey ?? null,
        idempotencyKey: params.idempotencyKey,
        status: 'processing',
        recipientCount: userIds.length,
        queuedCount: 0,
      }),
    );

    void this.processDispatch(dispatch.id, userIds, params).catch((err) => {
      this.logger.warn(`Dispatch ${dispatch.id} failed: ${String(err)}`);
    });

    return { dispatchId: dispatch.id, recipients: userIds.length };
  }

  private async processDispatch(
    dispatchId: string,
    userIds: string[],
    params: {
      templateKey: string;
      channel?: 'email' | 'push' | 'auto';
      idempotencyKey: string;
    },
  ): Promise<void> {
    let queued = 0;
    try {
      for (const userId of userIds) {
        await this.send.queueSend({
          userId,
          templateKey: params.templateKey,
          channel: params.channel,
          idempotencyKey: params.idempotencyKey,
          dispatchId,
        });
        queued += 1;
      }
      await this.dispatchRepo.update(dispatchId, {
        status: 'completed',
        queuedCount: queued,
      });
    } catch (err) {
      await this.dispatchRepo.update(dispatchId, {
        status: 'failed',
        queuedCount: queued,
        errorMessage: String(err),
      });
      throw err;
    }
  }

  async getDispatch(id: string): Promise<OutboundDispatchEntity | null> {
    return this.dispatchRepo.findOne({ where: { id } });
  }
}
