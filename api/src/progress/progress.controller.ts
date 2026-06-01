import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { ActivityQueryDto } from './dto/activity-query.dto.js';
import { ProgressService } from './progress.service.js';

@UseGuards(JwtAuthGuard)
@Controller('/progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async get(@Req() req: { user: { sub: string } }) {
    return await this.progressService.getProgress(req.user.sub);
  }

  @Get('activity')
  async getActivity(
    @Req() req: { user: { sub: string } },
    @Query() query: ActivityQueryDto,
  ) {
    return await this.progressService.getActivity(req.user.sub, query.month);
  }
}
