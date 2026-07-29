import type { NotificationType } from '../entities/notification-type.enum.js';

export type NotificationFeedItemDto = {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string;
  route: string | null;
  sentAt: string;
  readAt: string | null;
};

export type NotificationFeedResponseDto = {
  items: NotificationFeedItemDto[];
  unreadCount: number;
};

export type MarkNotificationsReadDto = {
  ids?: string[];
};

export type MarkNotificationsReadResponseDto = {
  unreadCount: number;
};
