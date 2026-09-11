import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildRedditSignUpPayload,
  type RedditActionSource,
  type RedditSignUpPayload,
} from './reddit-conversions.js';

export const REDDIT_CONVERSIONS_FETCH = 'REDDIT_CONVERSIONS_FETCH';

const CAPI_BASE = 'https://ads-api.reddit.com/api/v3/pixels';

export type RedditSignUpTrackParams = {
  isNewUser: boolean;
  userId: string;
  email?: string | null;
  ipAddress?: string;
  userAgent?: string;
  clickId?: string;
  idfa?: string;
  aaid?: string;
  actionSource?: RedditActionSource;
};

@Injectable()
export class RedditConversionsService {
  private readonly logger = new Logger(RedditConversionsService.name);
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(REDDIT_CONVERSIONS_FETCH)
    fetchImpl?: typeof fetch,
  ) {
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  isConfigured(): boolean {
    return Boolean(this.pixelId() && this.accessToken());
  }

  async scheduleSignUp(params: RedditSignUpTrackParams): Promise<void> {
    if (!params.isNewUser) return;
    if (!this.isConfigured()) return;
    try {
      await this.postSignUp(params);
    } catch (err) {
      this.logger.warn('Reddit SIGN_UP conversion failed', err);
    }
  }

  private async postSignUp(params: RedditSignUpTrackParams): Promise<void> {
    const pixelId = this.pixelId();
    const token = this.accessToken();
    if (!pixelId || !token) return;

    const payload: RedditSignUpPayload = buildRedditSignUpPayload({
      userId: params.userId,
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      clickId: params.clickId,
      idfa: params.idfa,
      aaid: params.aaid,
      actionSource: params.actionSource ?? 'APP',
      eventAtMs: Date.now(),
      eventSourceUrl: this.eventSourceUrl(),
      testId: this.testId(),
    });

    const res = await this.fetchImpl(
      `${CAPI_BASE}/${encodeURIComponent(pixelId)}/conversion_events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.warn(
        `Reddit CAPI ${res.status}: ${body.slice(0, 500)}`,
      );
    }
  }

  private pixelId(): string | undefined {
    return this.config.get<string>('REDDIT_PIXEL_ID')?.trim() || undefined;
  }

  private accessToken(): string | undefined {
    return (
      this.config.get<string>('REDDIT_CONVERSIONS_ACCESS_TOKEN')?.trim() ||
      undefined
    );
  }

  private testId(): string | undefined {
    return (
      this.config.get<string>('REDDIT_CONVERSIONS_TEST_ID')?.trim() || undefined
    );
  }

  private eventSourceUrl(): string | undefined {
    return this.config.get<string>('PUBLIC_APP_URL')?.trim() || undefined;
  }
}
