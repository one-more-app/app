import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
