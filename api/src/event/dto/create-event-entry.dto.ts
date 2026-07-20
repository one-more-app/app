import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EventExercise } from '../entities/event-exercise.enum.js';
import { EventGender } from '../entities/event-gender.enum.js';

export class CreateEventEntryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsEnum(EventGender)
  gender!: EventGender;

  @IsEnum(EventExercise)
  exercise!: EventExercise;

  @IsInt()
  @Min(1)
  @Max(9999)
  reps!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
