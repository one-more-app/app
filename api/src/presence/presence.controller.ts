import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { PresenceService } from './presence.service.js';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get('friends')
  async getFriendsPresence(@Req() req: { user: { sub: string } }) {
    const items = await this.presenceService.getFriendsPresence(req.user.sub);
    return { items };
  }
}
