import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { FromLocationDto } from './dto/from-location.dto.js';
import { UpsertUserGymDto } from './dto/upsert-user-gym.dto.js';
import { GymsService } from './gyms.service.js';

@Controller('/gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/search')
  async searchGyms(
    @Query('q') q?: string,
    @Query('lat') latRaw?: string,
    @Query('lng') lngRaw?: string,
  ) {
    const lat = latRaw != null ? Number.parseFloat(latRaw) : undefined;
    const lng = lngRaw != null ? Number.parseFloat(lngRaw) : undefined;
    return await this.gymsService.searchGyms({
      q,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/places/:placeId')
  async getPlaceDetails(@Param('placeId') placeId: string) {
    return await this.gymsService.getPlaceDetails(placeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async getUserGym(@Req() req: { user: { sub: string } }) {
    const gym = await this.gymsService.getUserGym(req.user.sub);
    return { gym };
  }

  @UseGuards(JwtAuthGuard)
  @Put('/me')
  async upsertUserGym(
    @Req() req: { user: { sub: string } },
    @Body() body: UpsertUserGymDto,
  ) {
    const gym = await this.gymsService.upsertUserGym(req.user.sub, body);
    return { gym };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/me')
  async deleteUserGym(@Req() req: { user: { sub: string } }) {
    return await this.gymsService.deleteUserGym(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/me/from-location')
  async fromLocation(
    @Req() req: { user: { sub: string } },
    @Body() body: FromLocationDto,
  ) {
    return await this.gymsService.fromLocation(req.user.sub, body.lat, body.lng);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/me/clear-onboarding-pending')
  async clearOnboardingPending(@Req() req: { user: { sub: string } }) {
    await this.gymsService.clearOnboardingGymPending(req.user.sub);
    return { ok: true };
  }
}
