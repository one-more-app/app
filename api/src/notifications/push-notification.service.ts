import { appendFileSync } from 'node:fs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { App } from 'firebase-admin/app';
import type { Messaging } from 'firebase-admin/messaging';
import { Repository } from 'typeorm';
import type { PushPayload } from './dto/push-payload.dto.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity.js';

const DEBUG_LOG_PATH =
  '/Users/tomguastapaglia/one-more/one-more/.cursor/debug-01d7dc.log';

function pushApiDebug(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
) {
  try {
    appendFileSync(
      DEBUG_LOG_PATH,
      `${JSON.stringify({
        sessionId: '01d7dc',
        runId: 'pre-fix',
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    /* debug log best-effort */
  }
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseApp: App | null = null;
  private messaging: Messaging | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly deviceTokens: DeviceTokensService,
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveriesRepo: Repository<NotificationDeliveryEntity>,
  ) {}

  onModuleInit() {
    void this.initFirebase();
  }

  private async initFirebase() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw?.trim()) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_JSON absent — push notifications désactivées',
      );
      return;
    }
    try {
      const { initializeApp, cert, getApps } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');
      const serviceAccount = JSON.parse(raw) as Record<string, unknown>;
      this.firebaseApp =
        getApps().length > 0
          ? getApps()[0]!
          : initializeApp({ credential: cert(serviceAccount) });
      this.messaging = getMessaging(this.firebaseApp);
      this.logger.log('Firebase Admin initialisé pour les push notifications');
    } catch (err) {
      this.logger.error(`Firebase init failed: ${String(err)}`);
    }
  }

  private async shouldSend(
    userId: string,
    payload: PushPayload,
  ): Promise<boolean> {
    try {
      await this.deliveriesRepo.insert({
        userId,
        type: payload.type,
        dedupKey: payload.dedupKey,
        sentAt: new Date(),
      });
      return true;
    } catch {
      return false;
    }
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.messaging) return;
    const allowed = await this.shouldSend(userId, payload);
    if (!allowed) return;

    const tokens = await this.deviceTokens.listForUser(userId);
    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        route: payload.route,
      },
      android: {
        notification: {
          icon: 'ic_stat_notification',
          color: '#DFFF00',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
          },
        },
      },
      tokens: tokens.map((t) => t.token),
    };

    try {
      const result = await this.messaging.sendEachForMulticast(message);
      const successCount = result.responses.filter((r) => r.success).length;
      this.logger.log(
        `Push ${payload.type} → user ${userId}: ${successCount}/${tokens.length} ok`,
      );
      result.responses.forEach((res, idx) => {
        const token = tokens[idx]?.token;
        const platform = tokens[idx]?.platform ?? 'unknown';
        if (res.success) {
          this.logger.debug(
            `Push ok (${platform}) token …${token?.slice(-8) ?? '?'}`,
          );
          return;
        }
        const code = res.error?.code ?? 'unknown';
        const msg = res.error?.message ?? '';
        this.logger.warn(
          `Push failed (${platform}) code=${code} msg=${msg} token …${token?.slice(-8) ?? '?'}`,
        );
        if (
          token &&
          (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token')
        ) {
          void this.deviceTokens.removeInvalidToken(token);
        }
      });
    } catch (err) {
      this.logger.warn(`Push send failed for ${userId}: ${String(err)}`);
    }
  }

  async sendTestPush(userId: string) {
    pushApiDebug('push-notification.service.ts:sendTestPush', 'start', {
      userId,
      hasMessaging: Boolean(this.messaging),
    }, 'H-B');

    if (!this.messaging) {
      pushApiDebug('push-notification.service.ts:sendTestPush', 'firebase not configured', {}, 'H-E');
      return {
        ok: false,
        firebaseConfigured: false,
        results: [] as Array<{
          platform: string;
          tokenSuffix: string;
          success: boolean;
          errorCode?: string;
          errorMessage?: string;
        }>,
      };
    }

    const tokens = await this.deviceTokens.listForUser(userId);
    pushApiDebug('push-notification.service.ts:sendTestPush', 'tokens loaded', {
      count: tokens.length,
      platforms: tokens.map((t) => t.platform),
      tokenSuffixes: tokens.map((t) => t.token.slice(-8)),
      tokenLengths: tokens.map((t) => t.token.length),
    }, 'H-A');

    if (tokens.length === 0) {
      pushApiDebug('push-notification.service.ts:sendTestPush', 'no tokens in DB', {}, 'H-E');
      return { ok: false, firebaseConfigured: true, results: [] };
    }

    const title = 'One More — test push';
    const body = 'Si tu vois ceci, les notifications fonctionnent.';
    const message = {
      notification: { title, body },
      data: { type: 'test', route: '/' },
      android: {
        notification: {
          icon: 'ic_stat_notification',
          color: '#DFFF00',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
          },
        },
      },
      tokens: tokens.map((t) => t.token),
    };

    const result = await this.messaging.sendEachForMulticast(message);
    const results = result.responses.map((res, idx) => {
      const entry = tokens[idx]!;
      return {
        platform: entry.platform,
        tokenSuffix: entry.token.slice(-8),
        success: res.success,
        errorCode: res.error?.code,
        errorMessage: res.error?.message,
      };
    });

    const payload = {
      ok: results.some((r) => r.success),
      firebaseConfigured: true,
      results,
    };
    pushApiDebug('push-notification.service.ts:sendTestPush', 'FCM response', {
      ok: payload.ok,
      results: results.map((r) => ({
        platform: r.platform,
        success: r.success,
        errorCode: r.errorCode ?? null,
        errorMessage: r.errorMessage ?? null,
        tokenSuffix: r.tokenSuffix,
      })),
    }, 'H-B');

    return payload;
  }
}
