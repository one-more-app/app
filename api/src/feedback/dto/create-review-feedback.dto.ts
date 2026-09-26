import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const REVIEW_CHIP_KEYS = [
  'slow_logging',
  'missing_exercise',
  'analytics',
  'cardio',
  'data',
  'bug',
  'other',
] as const;

export type ReviewChipKey = (typeof REVIEW_CHIP_KEYS)[number];

export class CreateReviewFeedbackDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsString({ each: true })
  @IsIn(REVIEW_CHIP_KEYS, { each: true })
  chips!: ReviewChipKey[];

  @IsOptional()
  @IsString()
  @MaxLength(280)
  message?: string;

  @IsString()
  @MaxLength(80)
  appVersion!: string;

  @IsIn(['web', 'ios', 'android'])
  platform!: 'web' | 'ios' | 'android';

  @IsString()
  @MaxLength(16)
  locale!: string;

  @IsInt()
  @Min(0)
  sessionsCount!: number;

  @IsISO8601()
  createdAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  osVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  sessionId?: string;
}
