import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { ProfileService } from './profile.service.js';
import { UpsertProfileDto } from './profile.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: any) {
    return await this.profileService.getProfile(req.user.sub);
  }

  @Put()
  async upsertProfile(@Req() req: any, @Body() body: UpsertProfileDto) {
    return await this.profileService.upsertProfile(req.user.sub, body);
  }
}
