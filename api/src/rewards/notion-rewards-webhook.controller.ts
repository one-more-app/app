import { BadRequestException, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NotionRewardsWebhookService } from './notion-rewards-webhook.service.js';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller()
export class NotionRewardsWebhookController {
  constructor(private readonly webhookService: NotionRewardsWebhookService) {}

  @Post('/webhooks/notion/rewards')
  async handle(@Req() req: RawBodyRequest) {
    const rawBody = req.rawBody;
    if (!rawBody?.length) {
      throw new BadRequestException('Corps brut requis');
    }
    const signature = req.headers['x-notion-signature'];
    return await this.webhookService.handle(
      rawBody,
      typeof signature === 'string' ? signature : undefined,
    );
  }
}
