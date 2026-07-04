import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 512 * 1024 },
    }),
  )
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return await this.profileService.uploadAvatar(req.user.sub, {
      buffer: file?.buffer ?? Buffer.alloc(0),
      mimetype: file?.mimetype ?? '',
      size: file?.size ?? 0,
    });
  }
}
