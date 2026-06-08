import type { NotificationType } from '../entities/notification-type.enum.js';

export type PushPayload = {
  type: NotificationType;
  title: string;
  body: string;
  route: string;
  dedupKey: string;
};
