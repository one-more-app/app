import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service.js';
import { TshirtRewardClaimEntity } from './entities/tshirt-reward-claim.entity.js';
import { TshirtRewardStatus } from './entities/tshirt-reward-status.enum.js';
import {
  isForwardStatusTransition,
  notionRewardStatusToClaimStatus,
} from './lib/map-notion-reward-status.js';
import {
  fetchNotionRewardsPage,
  notionIdsEqual,
} from './lib/notion-rewards-page.js';
import { verifyNotionWebhookSignature } from './lib/notion-webhook-signature.js';
import {
  readNotionEnv,
  readRewardsNotionDatabaseId,
} from './lib/notion-env.js';

type NotionWebhookBody = {
  verification_token?: string;
  type?: string;
  entity?: { id?: string; type?: string };
};

@Injectable()
export class NotionRewardsWebhookService {
  private readonly logger = new Logger(NotionRewardsWebhookService.name);

  constructor(
    @InjectRepository(TshirtRewardClaimEntity)
    private readonly claimsRepo: Repository<TshirtRewardClaimEntity>,
    private readonly config: ConfigService,
    private readonly notifications: NotificationDispatchService,
  ) {}

  async handle(rawBody: Buffer, signatureHeader: string | undefined) {
    let body: NotionWebhookBody;
    try {
      body = JSON.parse(rawBody.toString('utf8')) as NotionWebhookBody;
    } catch {
      throw new BadRequestException('Corps webhook invalide');
    }

    const verificationToken = readNotionEnv(
      this.config,
      'NOTION_WEBHOOK_VERIFICATION_TOKEN',
    );

    if (typeof body.verification_token === 'string') {
      this.logger.warn(
        `Notion webhook handshake — enregistre NOTION_WEBHOOK_VERIFICATION_TOKEN=${body.verification_token}`,
      );
      return { ok: true as const };
    }

    if (!verificationToken) {
      throw new UnauthorizedException('Webhook Notion non configuré');
    }

    if (
      !verifyNotionWebhookSignature(rawBody, signatureHeader, verificationToken)
    ) {
      throw new UnauthorizedException('Signature webhook invalide');
    }

    if (body.type !== 'page.properties_updated') {
      return { ok: true as const };
    }

    const pageId = body.entity?.id?.trim();
    if (!pageId || body.entity?.type !== 'page') {
      return { ok: true as const };
    }

    await this.syncClaimFromNotionPage(pageId);
    return { ok: true as const };
  }

  private async syncClaimFromNotionPage(pageId: string): Promise<void> {
    const notionToken = readNotionEnv(this.config, 'NOTION_TOKEN');
    const rewardsDbId = readRewardsNotionDatabaseId(this.config);
    if (!notionToken || !rewardsDbId) {
      this.logger.debug(
        'Notion rewards sync ignoré (token ou base manquants).',
      );
      return;
    }

    const parsed = await fetchNotionRewardsPage(notionToken, pageId);
    if (
      !parsed?.databaseId ||
      !notionIdsEqual(parsed.databaseId, rewardsDbId)
    ) {
      return;
    }

    const claim = await this.resolveClaim(pageId, parsed.claimId);
    if (!claim) return;

    if (parsed.claimId && parsed.claimId !== claim.id) {
      this.logger.warn(
        `Notion rewards sync refusé: Claim ID ${parsed.claimId} ≠ ${claim.id}`,
      );
      return;
    }

    const nextStatus = notionRewardStatusToClaimStatus(parsed.statusName);
    if (!nextStatus) return;

    if (
      claim.status === TshirtRewardStatus.ClaimPending ||
      claim.status === nextStatus
    ) {
      return;
    }

    const previousStatus = claim.status;
    claim.status = nextStatus;
    if (nextStatus === TshirtRewardStatus.Shipped && claim.shippedAt == null) {
      claim.shippedAt = new Date();
    }

    const saved = await this.claimsRepo.save(claim);

    if (isForwardStatusTransition(previousStatus, nextStatus)) {
      void this.notifications.notifyTshirtRewardStatusUpdated({
        userId: saved.userId,
        claimId: saved.id,
        rewardType: saved.rewardType,
        status: nextStatus,
      });
    }
  }

  private async resolveClaim(
    pageId: string,
    claimIdFromPage: string | null,
  ): Promise<TshirtRewardClaimEntity | null> {
    let claim = await this.claimsRepo.findOne({
      where: { notionPageId: pageId },
    });

    if (!claim && claimIdFromPage) {
      claim = await this.claimsRepo.findOne({
        where: { id: claimIdFromPage },
      });
      if (
        claim &&
        claim.notionPageId &&
        !notionIdsEqual(claim.notionPageId, pageId)
      ) {
        return null;
      }
      if (claim && !claim.notionPageId) {
        claim.notionPageId = pageId;
        await this.claimsRepo.save(claim);
      }
    }

    if (claim?.notionPageId && !notionIdsEqual(claim.notionPageId, pageId)) {
      return null;
    }

    return claim;
  }
}
