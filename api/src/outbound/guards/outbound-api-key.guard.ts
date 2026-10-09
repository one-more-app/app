import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

function safeEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

@Injectable()
export class OutboundApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('OUTBOUND_API_KEY')?.trim();
    if (!expected) {
      throw new UnauthorizedException('Outbound API non configurée');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-outbound-api-key'];
    if (typeof provided !== 'string' || !safeEqual(expected, provided)) {
      throw new UnauthorizedException('Clé outbound invalide');
    }

    return true;
  }
}
