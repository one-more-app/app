import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class OutboundSendDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MaxLength(128)
  templateKey!: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string | number | boolean>;

  @IsOptional()
  @IsIn(['email', 'push', 'auto'])
  channel?: 'email' | 'push' | 'auto';

  @IsString()
  @MaxLength(256)
  idempotencyKey!: string;
}

export class OutboundDispatchDto {
  @IsString()
  @MaxLength(128)
  segmentKey!: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  @IsString()
  @MaxLength(128)
  templateKey!: string;

  @IsOptional()
  @IsIn(['email', 'push', 'auto'])
  channel?: 'email' | 'push' | 'auto';

  @IsOptional()
  @IsString()
  @MaxLength(128)
  campaignKey?: string;

  @IsString()
  @MaxLength(256)
  idempotencyKey!: string;

  @IsOptional()
  confirmLargeAudience?: boolean;
}
