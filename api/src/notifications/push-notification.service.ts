import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { App } from 'firebase-admin/app';
import type { Messaging } from 'firebase-admin/messaging';
import { Repository } from 'typeorm';
import type { PushPayload } from './dto/push-payload.dto.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity.js';

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
      result.responses.forEach((res, idx) => {
        if (!res.success) {
          const token = tokens[idx]?.token;
          const code = res.error?.code ?? '';
          if (
            token &&
            (code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token')
          ) {
            void this.deviceTokens.removeInvalidToken(token);
          }
        }
      });
    } catch (err) {
      this.logger.warn(`Push send failed for ${userId}: ${String(err)}`);
    }
  }
}
