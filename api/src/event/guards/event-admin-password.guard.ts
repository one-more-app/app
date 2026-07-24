import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/** Mot de passe stand si `EVENT_ADMIN_PASSWORD` est absent. */
export const EVENT_ADMIN_PASSWORD_DEFAULT = 'zilton4life';

export const EVENT_ADMIN_PASSWORD_HEADER = 'x-event-admin-password';

@Injectable()
export class EventAdminPasswordGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected =
      this.config.get<string>('EVENT_ADMIN_PASSWORD')?.trim() ||
      EVENT_ADMIN_PASSWORD_DEFAULT;

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers[EVENT_ADMIN_PASSWORD_HEADER];
    if (typeof provided !== 'string' || provided !== expected) {
      throw new UnauthorizedException('Mot de passe admin invalide');
    }

    return true;
  }
}
