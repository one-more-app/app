import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertUserGymDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  placeId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(500)
  radiusM?: number;

  @IsOptional()
  @IsBoolean()
  onboardingGymPending?: boolean;

  @IsOptional()
  @IsBoolean()
  geofenceEnabled?: boolean;
}
