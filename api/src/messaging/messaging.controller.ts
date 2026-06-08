import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service.js';
import { RealtimeBroadcaster } from '../realtime/realtime-broadcaster.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { MessagingService } from './messaging.service.js';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly realtime: RealtimeBroadcaster,
    private readonly notifications: NotificationDispatchService,
  ) {}

  @Get('conversations')
  async listConversations(@Req() req: { user: { sub: string } }) {
    return await this.messagingService.listConversations(req.user.sub);
  }

  @Post('conversations/with/:userId')
  async getOrCreate(
    @Req() req: { user: { sub: string } },
    @Param('userId') otherUserId: string,
  ) {
    return await this.messagingService.getOrCreateConversation(
      req.user.sub,
      otherUserId,
    );
  }

  @Get('conversations/:id/messages')
  async listMessages(
    @Req() req: { user: { sub: string } },
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
  ) {
    return await this.messagingService.listMessages(
      req.user.sub,
      conversationId,
      cursor,
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req: { user: { sub: string } },
    @Param('id') conversationId: string,
    @Body() body: SendMessageDto,
  ) {
    const result = await this.messagingService.sendMessage(
      req.user.sub,
      conversationId,
      body.body,
    );
    this.realtime.emitMessageNew(result.recipientId, result.message);
    void this.notifications.notifyMessageNew({
      recipientId: result.recipientId,
      senderId: req.user.sub,
      conversationId,
      body: body.body,
    });
    return { message: result.message };
  }

  @Post('conversations/:id/read')
  async markRead(
    @Req() req: { user: { sub: string } },
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() body?: Record<string, unknown>,
  ) {
    const raw = body?.messageId;
    const messageId =
      typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
    if (messageId !== undefined && !isUUID(messageId, '4')) {
      throw new BadRequestException('messageId invalide');
    }

    const result = await this.messagingService.markRead(
      req.user.sub,
      conversationId,
      messageId,
    );
    if (result.senderId !== result.readerId) {
      this.realtime.emitMessageRead(result.senderId, {
        conversationId,
        messageId: messageId ?? result.messageId ?? conversationId,
        readerId: result.readerId,
      });
    }
    return { ok: result.ok };
  }
}
