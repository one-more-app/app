import {
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../../analytics/analytics.service.js';
import { ConsentService } from '../consent/consent.service.js';
import { OutboundMessageEntity } from '../entities/outbound-message.entity.js';
import { SnsMessageValidatorService } from './sns-message-validator.service.js';

function readTag(
  tags: Record<string, string[]> | undefined,
  name: string,
): string | null {
  if (!tags) return null;
  const exact = tags[name];
  if (exact?.length) return exact[0] ?? null;
  const lower = name.toLowerCase();
  for (const [key, values] of Object.entries(tags)) {
    if (key.toLowerCase() === lower && values?.length) {
      return values[0] ?? null;
    }
  }
  return null;
}

@Controller('webhooks/ses')
export class SesWebhookController {
  constructor(
    private readonly snsValidator: SnsMessageValidatorService,
    @InjectRepository(OutboundMessageEntity)
    private readonly messagesRepo: Repository<OutboundMessageEntity>,
    private readonly consent: ConsentService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Req() req: RawBodyRequest<Request>): Promise<string | void> {
    const raw =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : (req.rawBody?.toString('utf8') ?? JSON.stringify(req.body));

    const envelope = await this.snsValidator.validate(raw);
    const type = envelope.Type as string | undefined;

    const expectedTopic = process.env.SES_SNS_TOPIC_ARN?.trim();
    if (
      expectedTopic &&
      typeof envelope.TopicArn === 'string' &&
      envelope.TopicArn !== expectedTopic
    ) {
      throw new UnauthorizedException('Topic SNS inattendu');
    }

    if (type === 'SubscriptionConfirmation') {
      const url = envelope.SubscribeURL;
      if (typeof url === 'string') {
        await fetch(url);
      }
      return 'ok';
    }

    if (type !== 'Notification') {
      return 'ignored';
    }

    const messageRaw = envelope.Message;
    if (typeof messageRaw !== 'string') return 'ignored';

    let sesEvent: Record<string, unknown>;
    try {
      sesEvent = JSON.parse(messageRaw) as Record<string, unknown>;
    } catch {
      return 'ignored';
    }

    const eventType = sesEvent.eventType as string | undefined;
    const mail = sesEvent.mail as
      | { tags?: Record<string, string[]>; destination?: string[] }
      | undefined;
    const tags = mail?.tags;
    const userId = readTag(tags, 'userId');
    const outboundMessageId = readTag(tags, 'outboundMessageId');
    const templateKey = readTag(tags, 'templateKey');
    const campaignKey = readTag(tags, 'campaignKey');
    const segmentKey = readTag(tags, 'segmentKey');

    if (eventType === 'Bounce') {
      const bounce = sesEvent.bounce as { bounceType?: string } | undefined;
      if (bounce?.bounceType === 'Permanent' && mail?.destination?.[0]) {
        await this.consent.recordSuppression({
          email: mail.destination[0],
          reason: 'bounce_hard',
          meta: { sesEvent: eventType },
        });
      }
    }

    if (eventType === 'Complaint' && mail?.destination?.[0]) {
      await this.consent.recordSuppression({
        email: mail.destination[0],
        reason: 'complaint',
        meta: { sesEvent: eventType },
      });
    }

    if (!userId) return 'ok';

    if (outboundMessageId) {
      if (eventType === 'Open') {
        await this.messagesRepo.update(outboundMessageId, {
          openedAt: new Date(),
        });
        await this.analytics.track(userId, 'email_opened', {
          template_key: templateKey ?? undefined,
          channel: 'email',
          ...(campaignKey ? { campaign_key: campaignKey } : {}),
          ...(segmentKey ? { segment_key: segmentKey } : {}),
        });
      }
      if (eventType === 'Click') {
        await this.messagesRepo.update(outboundMessageId, {
          clickedAt: new Date(),
        });
        await this.analytics.track(userId, 'email_clicked', {
          template_key: templateKey ?? undefined,
          channel: 'email',
          ...(campaignKey ? { campaign_key: campaignKey } : {}),
          ...(segmentKey ? { segment_key: segmentKey } : {}),
        });
      }
    }

    return 'ok';
  }
}
