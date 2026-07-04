import { Injectable, Logger } from '@nestjs/common';
import { OpenPanel } from '@openpanel/sdk';
import {
  getOpenPanelApiUrl,
  getOpenPanelClientId,
  getOpenPanelClientSecret,
  isOpenPanelServerConfigured,
} from './analytics.config.js';

export type ServerAnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ServerRevenueParams = {
  profileId: string;
  /** Montant en unité majeure (ex. 9,99 €), converti en centimes pour OpenPanel. */
  amount: number;
  currency: string;
  productId: string;
  provider?: string;
  properties?: ServerAnalyticsProperties;
};

/** OpenPanel attend __revenue en entier (centimes pour EUR/USD). */
export function toOpenPanelRevenueCents(amountMajorUnits: number): number {
  return Math.round(amountMajorUnits * 100);
}

function normalizeOpenPanelCurrency(currency: string): string {
  return currency.trim().toLowerCase();
}

/**
 * Tracking serveur OpenPanel — source de vérité pour revenus et événements critiques.
 * RevenueCat branchera ses webhooks ici (purchase_validated, subscription_renewed, etc.).
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly op: OpenPanel | null;

  constructor() {
    if (!isOpenPanelServerConfigured()) {
      this.op = null;
      return;
    }
    this.op = new OpenPanel({
      clientId: getOpenPanelClientId()!,
      clientSecret: getOpenPanelClientSecret()!,
      apiUrl: getOpenPanelApiUrl(),
    });
  }

  isEnabled(): boolean {
    return this.op !== null;
  }

  async track(
    profileId: string,
    event: string,
    properties: ServerAnalyticsProperties = {},
  ): Promise<void> {
    if (!this.op) return;
    try {
      await this.op.track(event, {
        ...this.compact(properties),
        profileId,
      });
    } catch (err) {
      this.logger.warn(`OpenPanel track failed: ${event}`, err);
    }
  }

  async identify(params: {
    profileId: string;
    email?: string;
    properties?: ServerAnalyticsProperties;
  }): Promise<void> {
    if (!this.op) return;
    try {
      await this.op.identify({
        profileId: params.profileId,
        email: params.email,
        properties: params.properties
          ? this.compact(params.properties)
          : undefined,
      });
    } catch (err) {
      this.logger.warn('OpenPanel identify failed', err);
    }
  }

  /**
   * Enregistre un revenu validé (achat confirmé côté serveur).
   * À appeler depuis le webhook RevenueCat quand il sera branché.
   */
  async trackValidatedPurchase(params: ServerRevenueParams): Promise<void> {
    if (!this.op) return;

    const currency = normalizeOpenPanelCurrency(params.currency);
    const amountCents = toOpenPanelRevenueCents(params.amount);
    const eventProps = this.compact({
      product_id: params.productId,
      currency,
      provider: params.provider ?? 'revenuecat',
      ...params.properties,
    });

    try {
      await this.op.track('purchase_validated', {
        ...eventProps,
        profileId: params.profileId,
      });
      await this.op.revenue(amountCents, {
        ...eventProps,
        currency,
        profileId: params.profileId,
      });
    } catch (err) {
      this.logger.warn('OpenPanel revenue track failed', err);
    }
  }

  private compact(
    props: ServerAnalyticsProperties,
  ): Record<string, string | number | boolean> {
    const out: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined) continue;
      out[key] = value;
    }
    return out;
  }
}
