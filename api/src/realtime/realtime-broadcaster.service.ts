import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import type { PresenceDto } from '../presence/presence.service.js';
import type { MessageDto } from '../messaging/messaging.service.js';

@Injectable()
export class RealtimeBroadcaster {
  private server: Server | null = null;

  attachServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown) {
    for (const userId of userIds) {
      this.emitToUser(userId, event, payload);
    }
  }

  emitMessageNew(recipientId: string, message: MessageDto) {
    this.emitToUser(recipientId, 'message:new', { message });
  }

  emitMessageRead(
    senderId: string,
    payload: {
      conversationId: string;
      messageId: string;
      readerId: string;
    },
  ) {
    this.emitToUser(senderId, 'message:read', payload);
  }

  emitPresenceUpdate(friendIds: string[], presence: PresenceDto) {
    this.emitToUsers(friendIds, 'presence:update', { presence });
  }

  emitFriendshipUpdated(userId: string, payload: unknown) {
    this.emitToUser(userId, 'friendship:updated', payload);
  }
}
