import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { FriendTrainingAlertsService } from './friend-training-alerts.service.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly deviceTokens: DeviceTokensService,
    private readonly preferences: NotificationPreferencesService,
    private readonly trainingAlerts: FriendTrainingAlertsService,
  ) {}

  @Post('devices')
  async registerDevice(
    @Req() req: { user: { sub: string } },
    @Body() body: RegisterDeviceDto,
  ) {
    return await this.deviceTokens.register(req.user.sub, body);
  }

  @Delete('devices')
  async removeDevice(
    @Req() req: { user: { sub: string } },
    @Body() body: { token: string },
  ) {
    return await this.deviceTokens.remove(req.user.sub, body.token);
  }

  @Get('preferences')
  async getPreferences(@Req() req: { user: { sub: string } }) {
    return await this.preferences.getOrCreate(req.user.sub);
  }

  @Patch('preferences')
  async updatePreferences(
    @Req() req: { user: { sub: string } },
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return await this.preferences.update(req.user.sub, body);
  }

  @Get('training-alerts')
  async listTrainingAlerts(@Req() req: { user: { sub: string } }) {
    const mutedFriendIds = await this.trainingAlerts.listMutedFriendIds(
      req.user.sub,
    );
    return { mutedFriendIds };
  }

  @Put('training-alerts/:friendId')
  async enableTrainingAlert(
    @Req() req: { user: { sub: string } },
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return await this.trainingAlerts.subscribe(req.user.sub, friendId);
  }

  @Delete('training-alerts/:friendId')
  async disableTrainingAlert(
    @Req() req: { user: { sub: string } },
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return await this.trainingAlerts.unsubscribe(req.user.sub, friendId);
  }
}
