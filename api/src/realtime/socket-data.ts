import type { JwtPayload } from '../auth/jwt.types.js';
import type { Socket } from 'socket.io';

type SocketData = {
  user?: JwtPayload;
};

function socketData(client: Socket): SocketData {
  return client.data as SocketData;
}

export function setSocketUser(client: Socket, user: JwtPayload): void {
  socketData(client).user = user;
}

export function getSocketUser(client: Socket): JwtPayload | undefined {
  return socketData(client).user;
}

export function requireSocketUser(client: Socket): JwtPayload {
  const user = getSocketUser(client);
  if (!user) {
    throw new Error('Socket not authenticated');
  }
  return user;
}
