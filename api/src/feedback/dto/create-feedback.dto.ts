import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const FEEDBACK_KINDS = ['bug', 'idea', 'suggestion'] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export class FeedbackContextDto {
  @IsOptional()
  @IsIn(['web', 'ios', 'android'])
  platform?: 'web' | 'ios' | 'android';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  route?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  buildNumber?: string;
}

export class CreateFeedbackDto {
  @IsIn(FEEDBACK_KINDS)
  kind!: FeedbackKind;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeedbackContextDto)
  context?: FeedbackContextDto;
}
