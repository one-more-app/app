import { Controller, Get, Post, Query, Req, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { SyncPushDto } from './sync.dto.js';
import { SyncService } from './sync.service.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class SyncController {
  constructor(private sync: SyncService) {}

  @Post('/sync/push')
  async push(@Req() req: any, @Body() body: SyncPushDto) {
    return await this.sync.push(req.user.sub, body);
  }

  @Get('/sync/pull')
  async pull(@Req() req: any, @Query('since') since?: string) {
    return await this.sync.pull(req.user.sub, since);
  }
}

