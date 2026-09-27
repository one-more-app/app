import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfileService } from '../profile/profile.service.js';
import type { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { buildAccountDeletionNotionPayload } from './build-account-deletion-notion-payload.js';
import { buildReviewNotionPayload } from './build-review-notion-payload.js';
import { buildSettingsNotionPayload } from './build-settings-notion-payload.js';
import { ensureReviewNotionDatabaseSchema } from './notion-review-schema-sync.js';
import type { CreateReviewFeedbackDto } from './dto/create-review-feedback.dto.js';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function readNotionEnv(config: ConfigService, key: string): string {
  const raw = config.get<string>(key)?.trim() ?? '';
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

/** Base unique « Retours clients » (review + réglages). */
export function readClientFeedbackDatabaseId(config: ConfigService): string {
  return (
    readNotionEnv(config, 'NOTION_REVIEW_FEEDBACK_DB_ID') ||
    readNotionEnv(config, 'NOTION_FEEDBACK_DB_ID')
  );
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly profileService: ProfileService,
  ) {}

  private async postNotionPage(
    notionToken: string,
    body: Record<string, unknown>,
    logLabel: string,
  ): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${NOTION_API_BASE}/pages`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${notionToken}`,
          'content-type': 'application/json',
          'notion-version': NOTION_VERSION,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(
          `Échec création ${logLabel} Notion (${response.status}): ${text}`,
        );
        throw new InternalServerErrorException(
          "Impossible d'enregistrer le feedback.",
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur appel Notion ${logLabel}: ${reason}`);
      throw new InternalServerErrorException(
        "Impossible d'enregistrer le feedback.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private feedbackStatusName(): string {
    return (
      readNotionEnv(this.config, 'NOTION_REVIEW_STATUS') ||
      readNotionEnv(this.config, 'NOTION_FEEDBACK_STATUS') ||
      'Backlog'
    );
  }

  async createReviewFeedback(
    userId: string,
    sessionEmail: string | null,
    payload: CreateReviewFeedbackDto,
  ): Promise<void> {
    const notionToken = readNotionEnv(this.config, 'NOTION_TOKEN');
    const notionDatabaseId = readClientFeedbackDatabaseId(this.config);

    if (!notionToken || !notionDatabaseId) {
      this.logger.error(
        'Notion feedback non configuré (NOTION_TOKEN + NOTION_REVIEW_FEEDBACK_DB_ID ou NOTION_FEEDBACK_DB_ID).',
      );
      throw new InternalServerErrorException(
        "Le service de feedback n'est pas disponible.",
      );
    }

    const statusName = this.feedbackStatusName();

    await ensureReviewNotionDatabaseSchema(
      notionToken,
      notionDatabaseId,
      statusName,
      this.logger,
    );

    const profile = await this.profileService.getProfile(userId);
    const notionPayload = buildReviewNotionPayload(
      notionDatabaseId,
      userId,
      sessionEmail,
      profile,
      payload,
      statusName,
    );

    await this.postNotionPage(notionToken, notionPayload, 'review feedback');
  }

  async create(
    userId: string,
    sessionEmail: string | null,
    payload: CreateFeedbackDto,
  ): Promise<void> {
    const notionToken = readNotionEnv(this.config, 'NOTION_TOKEN');
    const notionDatabaseId = readClientFeedbackDatabaseId(this.config);

    if (!notionToken || !notionDatabaseId) {
      this.logger.error(
        'Notion feedback non configuré (NOTION_TOKEN + NOTION_REVIEW_FEEDBACK_DB_ID ou NOTION_FEEDBACK_DB_ID).',
      );
      throw new InternalServerErrorException(
        "Le service de feedback n'est pas disponible.",
      );
    }

    const statusName = this.feedbackStatusName();

    await ensureReviewNotionDatabaseSchema(
      notionToken,
      notionDatabaseId,
      statusName,
      this.logger,
    );

    const profile = await this.profileService.getProfile(userId);
    const notionPayload = buildSettingsNotionPayload(
      notionDatabaseId,
      userId,
      sessionEmail,
      profile,
      payload,
      statusName,
    );

    await this.postNotionPage(notionToken, notionPayload, 'feedback réglages');
  }

  /** Commentaire laissé dans le dialog de suppression de compte (Réglages). */
  async createAccountDeletionFeedback(
    userId: string,
    sessionEmail: string | null,
    comment: string,
  ): Promise<void> {
    const trimmed = comment.trim();
    if (!trimmed) return;

    const notionToken = readNotionEnv(this.config, 'NOTION_TOKEN');
    const notionDatabaseId = readClientFeedbackDatabaseId(this.config);

    if (!notionToken || !notionDatabaseId) {
      this.logger.error(
        'Notion feedback non configuré (NOTION_TOKEN + NOTION_REVIEW_FEEDBACK_DB_ID ou NOTION_FEEDBACK_DB_ID).',
      );
      throw new InternalServerErrorException(
        "Le service de feedback n'est pas disponible.",
      );
    }

    const statusName = this.feedbackStatusName();

    await ensureReviewNotionDatabaseSchema(
      notionToken,
      notionDatabaseId,
      statusName,
      this.logger,
    );

    const profile = await this.profileService.getProfile(userId);
    const notionPayload = buildAccountDeletionNotionPayload(
      notionDatabaseId,
      userId,
      sessionEmail,
      profile,
      trimmed,
      statusName,
    );

    await this.postNotionPage(
      notionToken,
      notionPayload,
      'feedback suppression de compte',
    );
  }
}
