import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ListTrackedExercisesQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  includeDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  withPerformance?: boolean;
}

export class CreateTrackedExerciseDto {
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
  @IsBoolean()
  isCustom?: boolean;
}

export class UpdateTrackedExerciseDto {
  @IsOptional()
  @IsString()
  name?: string;
}
