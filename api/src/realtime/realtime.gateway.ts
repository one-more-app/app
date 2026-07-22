import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../messaging/entities/conversation.entity.js';
import { FriendsService } from '../social/friends.service.js';
import { PresenceHeartbeatDto } from '../presence/dto/presence-heartbeat.dto.js';
import { PresenceStatus } from '../presence/entities/presence-status.enum.js';
import { PresenceService } from '../presence/presence.service.js';
import { RealtimeBroadcaster } from './realtime-broadcaster.service.js';
import {
  getSocketUser,
  requireSocketUser,
  setSocketUser,
} from './socket-data.js';
import { WsJwtGuard } from './ws-jwt.guard.js';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly broadcaster: RealtimeBroadcaster,
    private readonly wsJwtGuard: WsJwtGuard,
    private readonly presenceService: PresenceService,
    private readonly friendsService: FriendsService,
    @InjectRepository(ConversationEntity)
    private readonly conversationsRepo: Repository<ConversationEntity>,
  ) {}

  afterInit(server: Server) {
    this.broadcaster.attachServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const user = this.wsJwtGuard.authenticateSocket(client);
      setSocketUser(client, user);
      await client.join(`user:${user.sub}`);
      const presence = await this.presenceService.updateHeartbeat(user.sub, {
        status: PresenceStatus.ONLINE,
      });
      const friendIds = await this.friendsService.getAcceptedFriendIds(
        user.sub,
      );
      this.broadcaster.emitPresenceUpdate(friendIds, presence);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = getSocketUser(client)?.sub;
    if (!userId) return;
    try {
      const presence = await this.presenceService.updateHeartbeat(userId, {
        status: PresenceStatus.OFFLINE,
      });
      const friendIds = await this.friendsService.getAcceptedFriendIds(userId);
      this.broadcaster.emitPresenceUpdate(friendIds, presence);
    } catch (err) {
      this.logger.warn(`Disconnect presence failed: ${String(err)}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('presence:heartbeat')
  async onPresenceHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: PresenceHeartbeatDto,
  ) {
    const userId = requireSocketUser(client).sub;
    const presence = await this.presenceService.updateHeartbeat(userId, body);
    const friendIds = await this.friendsService.getAcceptedFriendIds(userId);
    this.broadcaster.emitPresenceUpdate(friendIds, presence);
    return { ok: true, presence };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('conversation:join')
  async onConversationJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    const userId = requireSocketUser(client).sub;
    const conversation = await this.conversationsRepo.findOne({
      where: { id: body.conversationId },
    });
    if (
      !conversation ||
      (conversation.participantLowId !== userId &&
        conversation.participantHighId !== userId)
    ) {
      return { ok: false };
    }
    await client.join(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('session:join')
  async onSessionJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { ownerUserId: string; date: string },
  ) {
    const userId = requireSocketUser(client).sub;
    if (!body.ownerUserId || !body.date) return { ok: false };
    if (body.ownerUserId !== userId) {
      const friendIds = await this.friendsService.getAcceptedFriendIds(userId);
      if (!friendIds.includes(body.ownerUserId)) return { ok: false };
    }
    await client.join(`session:${body.ownerUserId}:${body.date}`);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('session:leave')
  async onSessionLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { ownerUserId: string; date: string },
  ) {
    if (!body.ownerUserId || !body.date) return { ok: false };
    await client.leave(`session:${body.ownerUserId}:${body.date}`);
    return { ok: true };
  }
}
