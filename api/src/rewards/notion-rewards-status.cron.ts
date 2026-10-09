import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotionRewardsWebhookService } from './notion-rewards-webhook.service.js';

@Injectable()
export class NotionRewardsStatusCron {
  private readonly logger = new Logger(NotionRewardsStatusCron.name);

  constructor(
    private readonly notionRewardsWebhook: NotionRewardsWebhookService,
  ) {}

  /** File d'attente Notion : applique les statuts stables depuis ≥ debounce minutes. */
  @Cron('* * * * *')
  async flushPendingNotionStatuses() {
    try {
      await this.notionRewardsWebhook.flushDuePendingStatuses();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Notion pending status flush failed: ${reason}`);
    }
  }
}
