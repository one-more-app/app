import type { NotificationType } from '../entities/notification-type.enum.js';
import type { PushAnalyticsPayload } from '../push-analytics.js';

export type PushPayload = {
  type: NotificationType;
  title: string;
  body: string;
  route: string;
  dedupKey: string;
  analytics?: PushAnalyticsPayload;
};
