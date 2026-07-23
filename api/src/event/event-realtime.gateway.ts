import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  EVENT_LEADERBOARD_ROOM,
  RealtimeBroadcaster,
} from '../realtime/realtime-broadcaster.service.js';

/**
 * Namespace public pour le stand event (TV + admin).
 * Pas de JWT : lecture seule via room ; les écritures restent sur REST `/public/event`.
 */
@WebSocketGateway({
  namespace: '/event',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class EventRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly broadcaster: RealtimeBroadcaster) {}

  afterInit(server: Server) {
    this.broadcaster.attachEventServer(server);
  }

  async handleConnection(client: Socket) {
    await client.join(EVENT_LEADERBOARD_ROOM);
  }
}
