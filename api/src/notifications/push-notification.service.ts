import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import type { Messaging } from 'firebase-admin/messaging';
import type { PushPayload } from './dto/push-payload.dto.js';
import { DeviceTokensService } from './device-tokens.service.js';
import {
  pushAnalyticsToFcmData,
  toPushAnalyticsOpenPanelProps,
} from './push-analytics.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

/**
 * Sends FCM only. Feed persistence / dedup lives in NotificationFeedService
 * (callers record first, then send if prefs allow).
 */
@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseApp: App | null = null;
  private messaging: Messaging | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly deviceTokens: DeviceTokensService,
    private readonly analytics: AnalyticsService,
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
      const { initializeApp, cert, getApps } =
        await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');
      const serviceAccount = JSON.parse(raw) as Record<string, unknown>;
      this.firebaseApp =
        getApps().length > 0
          ? getApps()[0]
          : initializeApp({ credential: cert(serviceAccount) });
      this.messaging = getMessaging(this.firebaseApp);
      this.logger.log('Firebase Admin initialisé pour les push notifications');
    } catch (err) {
      this.logger.error(`Firebase init failed: ${String(err)}`);
    }
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<boolean> {
    if (!this.messaging) return false;

    const tokens = await this.deviceTokens.listForUser(userId);
    if (tokens.length === 0) return false;

    const analyticsData = pushAnalyticsToFcmData(payload.analytics);
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        route: payload.route,
        ...analyticsData,
      },
      android: {
        priority: 'high' as const,
        notification: {
          icon: 'ic_stat_notification',
          color: '#dfff5e',
          sound: 'default',
          channelId: 'one-more-push',
          defaultSound: true,
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
        },
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
      tokens: tokens.map((t) => t.token),
    };

    try {
      const result = await this.messaging.sendEachForMulticast(message);
      let successCount = 0;
      result.responses.forEach((res, idx) => {
        if (res.success) {
          successCount += 1;
          return;
        }
        const token = tokens[idx]?.token;
        const code = res.error?.code ?? '';
        if (
          token &&
          (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token')
        ) {
          void this.deviceTokens.removeInvalidToken(token);
        }
      });
      if (successCount > 0) {
        await this.analytics.track(userId, 'push_sent', {
          type: payload.type,
          channel: 'push',
          ...toPushAnalyticsOpenPanelProps(payload.analytics),
        });
        return true;
      }
      return false;
    } catch (err) {
      this.logger.warn(`Push send failed for ${userId}: ${String(err)}`);
      return false;
    }
  }
}
