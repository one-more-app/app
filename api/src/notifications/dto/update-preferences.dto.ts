import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  streakReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  friendRequests?: boolean;

  @IsOptional()
  @IsBoolean()
  friendAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @IsOptional()
  @IsBoolean()
  sessionComments?: boolean;

  @IsOptional()
  @IsBoolean()
  friendTraining?: boolean;

  @IsOptional()
  @IsBoolean()
  friendRecords?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyRecap?: boolean;
}
