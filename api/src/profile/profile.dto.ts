import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpsertProfileDto {
  @IsNumber()
  weightKg!: number;

  @IsNumber()
  heightCm!: number;

  @IsString()
  gender!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}

export class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9_]+$/)
  username!: string;
}

export class UpsertAttributionDto {
  @IsOptional()
  @IsString()
  mediaSource?: string | null;

  @IsOptional()
  @IsString()
  campaign?: string | null;

  @IsOptional()
  @IsString()
  adset?: string | null;

  @IsOptional()
  @IsString()
  adgroup?: string | null;

  @IsOptional()
  @IsString()
  keywords?: string | null;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isRetargeting?: boolean | null;

  @IsOptional()
  @IsString()
  afSub1?: string | null;

  @IsOptional()
  @IsString()
  deepLinkValue?: string | null;
}
