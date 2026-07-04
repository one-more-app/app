import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { FriendsService } from '../social/friends.service.js';
import { ConversationEntity } from './entities/conversation.entity.js';
import { MessageEntity } from './entities/message.entity.js';
import {
  orderedParticipantIds,
  otherParticipantId,
} from './lib/conversation-participants.js';

const PAGE_SIZE = 50;

export type MessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationsRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messagesRepo: Repository<MessageEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    private readonly friendsService: FriendsService,
  ) {}

  private toMessageDto(m: MessageEntity): MessageDto {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    };
  }

  private async getConversationForUser(userId: string, conversationId: string) {
    const conversation = await this.conversationsRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable');
    if (
      conversation.participantLowId !== userId &&
      conversation.participantHighId !== userId
    ) {
      throw new ForbiddenException('Conversation non accessible');
    }
    return conversation;
  }

  async listConversations(userId: string) {
    const conversations = await this.conversationsRepo
      .createQueryBuilder('c')
      .where('c.participantLowId = :userId OR c.participantHighId = :userId', {
        userId,
      })
      .orderBy('c.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('c.createdAt', 'DESC')
      .getMany();

    const results = await Promise.all(
      conversations.map(async (c) => {
        const otherId = otherParticipantId(c, userId);
        const profile = await this.profilesRepo.findOne({
          where: { userId: otherId },
        });
        const lastMessage = await this.messagesRepo.findOne({
          where: { conversationId: c.id },
          order: { createdAt: 'DESC' },
        });
        const unreadFromOther = await this.messagesRepo.count({
          where: {
            conversationId: c.id,
            senderId: otherId,
            readAt: IsNull(),
          },
        });

        return {
          id: c.id,
          otherUser: {
            userId: otherId,
            firstName: profile?.firstName ?? null,
            lastName: profile?.lastName ?? null,
            username: profile?.username ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
          },
          lastMessage: lastMessage ? this.toMessageDto(lastMessage) : null,
          unreadCount: unreadFromOther,
        };
      }),
    );

    return { conversations: results };
  }

  async getOrCreateConversation(userId: string, otherUserId: string) {
    await this.friendsService.assertAcceptedFriends(userId, otherUserId);
    const { participantLowId, participantHighId } = orderedParticipantIds(
      userId,
      otherUserId,
    );

    let conversation = await this.conversationsRepo.findOne({
      where: { participantLowId, participantHighId },
    });
    if (!conversation) {
      conversation = await this.conversationsRepo.save({
        participantLowId,
        participantHighId,
        lastMessageAt: null,
      });
    }

    const profile = await this.profilesRepo.findOne({
      where: { userId: otherUserId },
    });

    return {
      id: conversation.id,
      otherUser: {
        userId: otherUserId,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
    };
  }

  async listMessages(userId: string, conversationId: string, cursor?: string) {
    await this.getConversationForUser(userId, conversationId);

    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .orderBy('m.createdAt', 'DESC')
      .take(PAGE_SIZE);

    if (cursor) {
      const cursorMessage = await this.messagesRepo.findOne({
        where: { id: cursor, conversationId },
      });
      if (cursorMessage) {
        qb.andWhere('m.createdAt < :createdAt', {
          createdAt: cursorMessage.createdAt,
        });
      }
    }

    const messages = await qb.getMany();
    const ordered = messages.reverse().map((m) => this.toMessageDto(m));
    const nextCursor =
      messages.length === PAGE_SIZE ? (messages[0]?.id ?? null) : null;

    return { messages: ordered, nextCursor };
  }

  async sendMessage(userId: string, conversationId: string, body: string) {
    const conversation = await this.getConversationForUser(
      userId,
      conversationId,
    );
    const otherId = otherParticipantId(conversation, userId);
    await this.friendsService.assertAcceptedFriends(userId, otherId);

    const message = await this.messagesRepo.save({
      conversationId,
      senderId: userId,
      body: body.trim(),
      readAt: null,
    });

    conversation.lastMessageAt = message.createdAt;
    await this.conversationsRepo.save(conversation);

    const dto = this.toMessageDto(message);
    return { message: dto, recipientId: otherId };
  }

  async markRead(userId: string, conversationId: string, messageId?: string) {
    const conversation = await this.getConversationForUser(
      userId,
      conversationId,
    );
    const otherId = otherParticipantId(conversation, userId);

    const baseWhere = {
      conversationId,
      senderId: otherId,
      readAt: IsNull(),
    };

    if (messageId) {
      const target = await this.messagesRepo.findOne({
        where: { id: messageId, conversationId },
      });
      if (!target) throw new NotFoundException('Message introuvable');
      if (target.senderId !== userId) {
        await this.messagesRepo.update(
          {
            ...baseWhere,
            createdAt: LessThanOrEqual(target.createdAt),
          },
          { readAt: new Date() },
        );
      } else {
        await this.messagesRepo.update(baseWhere, { readAt: new Date() });
      }
    } else {
      await this.messagesRepo.update(baseWhere, { readAt: new Date() });
    }

    return {
      ok: true,
      readerId: userId,
      senderId: otherId,
      conversationId,
      messageId: messageId ?? null,
    };
  }
}
