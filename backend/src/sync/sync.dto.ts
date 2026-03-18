import {
  IsArray,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncProfileDto {
  @IsNumber()
  weightKg!: number;

  @IsNumber()
  heightCm!: number;

  @IsString()
  gender!: string;

  @IsISO8601()
  updatedAt!: string;
}

export class SyncTrackedExerciseDto {
  @IsString()
  id!: string;

  @IsString()
  exerciseId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  bodyPart?: string;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsString()
  equipment?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  gifUrl?: string;

  @IsOptional()
  @IsISO8601()
  deletedAt?: string;

  @IsISO8601()
  updatedAt!: string;

  @IsOptional()
  isCustom?: boolean;
}

export class SyncPerformanceEntryDto {
  @IsString()
  id!: string;

  @IsString()
  trackedExerciseId!: string;

  @IsISO8601()
  date!: string; // YYYY-MM-DD accepté (ISO partiel), ou ISO complet

  @IsNumber()
  weight!: number;

  @IsNumber()
  reps!: number;

  @IsISO8601()
  updatedAt!: string;

  @IsOptional()
  @IsISO8601()
  deletedAt?: string;
}

export class SyncPushDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SyncProfileDto)
  profile?: SyncProfileDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncTrackedExerciseDto)
  trackedExercises!: SyncTrackedExerciseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncPerformanceEntryDto)
  performanceEntries!: SyncPerformanceEntryDto[];
}

