import { IsNumber, IsOptional, IsString } from 'class-validator';

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
