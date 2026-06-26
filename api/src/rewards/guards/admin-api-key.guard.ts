import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    if (!expected?.trim()) {
      throw new UnauthorizedException('Admin API non configurée');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-admin-api-key'];
    if (typeof provided !== 'string' || provided !== expected) {
      throw new UnauthorizedException('Clé admin invalide');
    }

    return true;
  }
}
