import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfileService } from '../profile/profile.service.js';
import type { CreateFeedbackDto, FeedbackKind } from './dto/create-feedback.dto.js';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const FEEDBACK_KIND_TO_TICKET_TYPE: Record<FeedbackKind, string> = {
  bug: 'Fix',
  idea: 'Feat',
  suggestion: 'Chore',
};

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly profileService: ProfileService,
  ) {}

  async create(
    userId: string,
    sessionEmail: string | null,
    payload: CreateFeedbackDto,
  ): Promise<void> {
    const notionToken = this.config.get<string>('NOTION_TOKEN')?.trim() ?? '';
    const notionDatabaseId =
      this.config.get<string>('NOTION_FEEDBACK_DB_ID')?.trim() ?? '';

    if (!notionToken || !notionDatabaseId) {
      this.logger.error(
        'Notion feedback non configuré (NOTION_TOKEN / NOTION_FEEDBACK_DB_ID).',
      );
      throw new InternalServerErrorException(
        "Le service de feedback n'est pas disponible.",
      );
    }

    const profile = await this.profileService.getProfile(userId);

    const notionPayload = this.buildNotionPayload(
      notionDatabaseId,
      userId,
      sessionEmail,
      profile,
      payload,
    );

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
        body: JSON.stringify(notionPayload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(
          `Échec création feedback Notion (${response.status}): ${text}`,
        );
        throw new InternalServerErrorException(
          "Impossible d'enregistrer le feedback.",
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur appel Notion feedback: ${reason}`);
      throw new InternalServerErrorException(
        "Impossible d'enregistrer le feedback.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildNotionPayload(
    databaseId: string,
    userId: string,
    sessionEmail: string | null,
    profile: {
      firstName: string | null;
      lastName: string | null;
    } | null,
    payload: CreateFeedbackDto,
  ) {
    const firstName = profile?.firstName?.trim() || 'non renseigné';
    const lastName = profile?.lastName?.trim() || 'non renseigné';
    const email = sessionEmail?.trim() || 'non renseigné';
    const platform = payload.context?.platform ?? 'unknown';
    const route = payload.context?.route ?? '';

    const bodyLines = [
      payload.message,
      '',
      `Prénom: ${firstName}`,
      `Nom: ${lastName}`,
      `Email: ${email}`,
      `User ID: ${userId}`,
      `Plateforme: ${platform}`,
      route ? `Route: ${route}` : '',
      `Feedback type: ${payload.kind}`,
      `Date: ${new Date().toISOString()}`,
    ].filter(Boolean);

    return {
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: payload.title } }],
        },
        Type: {
          select: { name: FEEDBACK_KIND_TO_TICKET_TYPE[payload.kind] },
        },
        Status: {
          status: { name: 'Backlog' },
        },
        Priority: {
          select: { name: 'Low' },
        },
      },
      children: [
        {
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [
              { type: 'text' as const, text: { content: bodyLines.join('\n') } },
            ],
          },
        },
      ],
    };
  }
}
