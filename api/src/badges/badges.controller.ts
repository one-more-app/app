import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { BadgesService } from './badges.service.js';

@UseGuards(JwtAuthGuard)
@Controller('/badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('/me')
  listMine(@Req() req: { user: { sub: string } }) {
    return this.badgesService.listForUser(req.user.sub);
  }

  @Get('/user/:userId')
  listForUser(
    @Req() req: { user: { sub: string } },
    @Param('userId') userId: string,
  ) {
    return this.badgesService.listForFriend(req.user.sub, userId);
  }
}
