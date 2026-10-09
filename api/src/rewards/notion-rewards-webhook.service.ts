import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service.js';
import { TshirtRewardClaimEntity } from './entities/tshirt-reward-claim.entity.js';
import { TshirtRewardStatus } from './entities/tshirt-reward-status.enum.js';
import {
  isForwardStatusTransition,
  notionRewardStatusToClaimStatus,
} from './lib/map-notion-reward-status.js';
import {
  readNotionEnv,
  readRewardsNotionDatabaseId,
} from './lib/notion-env.js';
import {
  fetchNotionRewardsPage,
  notionIdsEqual,
  type ParsedRewardsNotionPage,
} from './lib/notion-rewards-page.js';
import {
  readNotionStatusDebounceMinutes,
  reconcileNotionClaimStatus,
  type NotionStatusReconcileResult,
} from './lib/notion-rewards-status-reconcile.js';
import { verifyNotionWebhookSignature } from './lib/notion-webhook-signature.js';

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

  async flushDuePendingStatuses(): Promise<void> {
    const pendingClaims = await this.claimsRepo.find({
      where: { notionPendingStatus: Not(IsNull()) },
    });
    for (const claim of pendingClaims) {
      if (!claim.notionPageId) continue;
      await this.syncClaimFromNotionPage(claim.notionPageId);
    }
  }

  private debounceMinutes(): number {
    return readNotionStatusDebounceMinutes(
      readNotionEnv(this.config, 'NOTION_REWARDS_STATUS_DEBOUNCE_MINUTES'),
    );
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

    await this.reconcileClaimWithNotionPage(claim, parsed);
  }

  private async reconcileClaimWithNotionPage(
    claim: TshirtRewardClaimEntity,
    parsed: ParsedRewardsNotionPage,
  ): Promise<void> {
    const nextStatus = notionRewardStatusToClaimStatus(parsed.statusName);
    const result = reconcileNotionClaimStatus(
      claim,
      nextStatus,
      new Date(),
      this.debounceMinutes(),
    );
    await this.applyReconcileResult(claim, result);
  }

  private async applyReconcileResult(
    claim: TshirtRewardClaimEntity,
    result: NotionStatusReconcileResult,
  ): Promise<void> {
    switch (result.kind) {
      case 'noop':
        return;
      case 'cancel_pending':
        claim.notionPendingStatus = null;
        claim.notionPendingSince = null;
        await this.claimsRepo.save(claim);
        return;
      case 'start_pending':
        claim.notionPendingStatus = result.pendingStatus;
        claim.notionPendingSince = result.pendingSince;
        await this.claimsRepo.save(claim);
        return;
      case 'apply': {
        const previousStatus = result.previousStatus;
        claim.status = result.nextStatus;
        claim.notionPendingStatus = null;
        claim.notionPendingSince = null;
        if (
          result.nextStatus === TshirtRewardStatus.Shipped &&
          claim.shippedAt == null
        ) {
          claim.shippedAt = new Date();
        }
        const saved = await this.claimsRepo.save(claim);
        if (isForwardStatusTransition(previousStatus, result.nextStatus)) {
          void this.notifications.notifyTshirtRewardStatusUpdated({
            userId: saved.userId,
            claimId: saved.id,
            rewardType: saved.rewardType,
            status: result.nextStatus,
          });
        }
        return;
      }
      default:
        return;
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
