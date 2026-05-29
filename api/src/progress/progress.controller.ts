import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { ProgressService } from './progress.service.js';

@UseGuards(JwtAuthGuard)
@Controller('/progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async get(@Req() req: { user: { sub: string } }) {
    return await this.progressService.getProgress(req.user.sub);
  }
}
