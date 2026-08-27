import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReminderSlotInputDto {
  @IsInt()
  @Min(1)
  @Max(7)
  weekday!: number;

  @IsInt()
  @Min(0)
  @Max(23)
  hour!: number;

  @IsInt()
  @Min(0)
  @Max(59)
  minute!: number;
}

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

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  @ArrayMaxSize(7)
  reminderWeekdays?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  reminderHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  reminderMinute?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => ReminderSlotInputDto)
  reminderSlots?: ReminderSlotInputDto[];
}
