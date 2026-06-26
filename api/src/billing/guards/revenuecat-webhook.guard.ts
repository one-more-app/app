import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class RevenueCatWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('REVENUECAT_WEBHOOK_SECRET');
    if (!secret?.trim()) {
      throw new UnauthorizedException('Webhook RevenueCat non configuré');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

    if (token !== secret) {
      throw new UnauthorizedException('Secret webhook invalide');
    }

    return true;
  }
}
