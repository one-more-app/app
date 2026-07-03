import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { extractRevenueFromRevenueCatEvent } from './lib/revenuecat-event-revenue.js';

const PREMIUM_ACTIVE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'NON_RENEWING_PURCHASE',
]);

const PREMIUM_INACTIVE_EVENTS = new Set(['EXPIRATION']);

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<
      string,
      { expires_date: string | null; product_identifier?: string }
    >;
  };
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
  ) {}

  private getPremiumEntitlementId(): string {
    return (
      this.config.get<string>('REVENUECAT_PREMIUM_ENTITLEMENT_ID') ?? 'premium'
    );
  }

  private hasActivePremiumEntitlement(
    entitlements:
      | Record<
          string,
          { expires_date: string | null; product_identifier?: string }
        >
      | undefined,
  ): boolean {
    if (!entitlements) return false;
    const entitlement = entitlements[this.getPremiumEntitlementId()];
    if (!entitlement) return false;
    if (!entitlement.expires_date) return true;
    return new Date(entitlement.expires_date).getTime() > Date.now();
  }

  async setPremium(userId: string, isPremium: boolean): Promise<void> {
    await this.usersRepo.update({ id: userId }, { isPremium });
  }

  async syncPremiumFromRevenueCat(
    userId: string,
  ): Promise<{ isPremium: boolean }> {
    const apiKey = this.config.get<string>('REVENUECAT_API_KEY');
    if (!apiKey?.trim()) {
      const user = await this.usersRepo.findOne({
        where: { id: userId },
        select: ['isPremium'],
      });
      return { isPremium: user?.isPremium ?? false };
    }

    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      this.logger.warn(
        `RevenueCat subscriber lookup failed for ${userId}: ${response.status}`,
      );
      const user = await this.usersRepo.findOne({
        where: { id: userId },
        select: ['isPremium'],
      });
      return { isPremium: user?.isPremium ?? false };
    }

    const data = (await response.json()) as RevenueCatSubscriberResponse;
    const isPremium = this.hasActivePremiumEntitlement(
      data.subscriber?.entitlements,
    );
    await this.setPremium(userId, isPremium);
    return { isPremium };
  }

  async handleRevenueCatWebhook(body: Record<string, unknown>): Promise<void> {
    const event = body.event as Record<string, unknown> | undefined;
    if (!event) return;

    const type = typeof event.type === 'string' ? event.type : '';
    const appUserId =
      typeof event.app_user_id === 'string' ? event.app_user_id : '';
    if (!appUserId) return;

    const user = await this.usersRepo.findOne({ where: { id: appUserId } });
    if (!user) {
      this.logger.warn(`RevenueCat webhook: unknown user ${appUserId}`);
      return;
    }

    if (PREMIUM_INACTIVE_EVENTS.has(type)) {
      await this.setPremium(appUserId, false);
      return;
    }

    if (PREMIUM_ACTIVE_EVENTS.has(type)) {
      const entitlementIds = event.entitlement_ids as string[] | undefined;
      const hasPremiumEntitlement =
        entitlementIds?.includes(this.getPremiumEntitlementId()) ?? false;

      if (hasPremiumEntitlement || type === 'NON_RENEWING_PURCHASE') {
        await this.setPremium(appUserId, true);

        const revenue = extractRevenueFromRevenueCatEvent(event);
        const productId =
          typeof event.product_id === 'string' ? event.product_id : 'unknown';
        if (revenue) {
          void this.analytics.trackValidatedPurchase({
            profileId: appUserId,
            amount: revenue.amount,
            currency: revenue.currency,
            productId,
            properties: { event_type: type },
          });
        }
      }
      return;
    }

    if (type === 'CANCELLATION') {
      // L'abonnement reste actif jusqu'à expiration — ne pas couper isPremium ici.
      return;
    }
  }
}
