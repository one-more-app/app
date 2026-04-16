import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListPerformanceEntriesQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  includeDeleted?: boolean;

  @IsOptional()
  @IsString()
  trackedExerciseId?: string;
}

export class CreatePerformanceEntryDto {
  @IsString()
  id!: string;

  @IsString()
  trackedExerciseId!: string;

  @IsISO8601()
  date!: string;

  @IsNumber()
  weight!: number;

  @IsNumber()
  reps!: number;
}

export class UpdatePerformanceEntryDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  reps?: number;
}
