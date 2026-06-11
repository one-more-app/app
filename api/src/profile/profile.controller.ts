import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { ProfileService } from './profile.service.js';
import { UpdateUsernameDto, UpsertProfileDto } from './profile.dto.js';

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

  @Get('/username/check')
  async checkUsername(@Req() req: any, @Query('username') username: string) {
    return await this.profileService.checkUsernameAvailability(
      username,
      req.user.sub,
    );
  }

  @Put('/username')
  async updateUsername(@Req() req: any, @Body() body: UpdateUsernameDto) {
    return await this.profileService.updateUsername(req.user.sub, body.username);
  }
}
