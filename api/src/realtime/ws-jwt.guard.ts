import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import type { JwtPayload } from '../auth/jwt.types.js';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const user = this.authenticateSocket(client);
    client.data.user = user;
    return true;
  }

  authenticateSocket(client: Socket): JwtPayload {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers.authorization as string | undefined)?.replace(
        /^Bearer\s+/i,
        '',
      );

    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret',
      });
    } catch {
      throw new UnauthorizedException('Token invalide');
    }
  }
}
