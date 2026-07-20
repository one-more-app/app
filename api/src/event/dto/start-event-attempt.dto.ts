import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EventExercise } from '../entities/event-exercise.enum.js';
import { EventGender } from '../entities/event-gender.enum.js';

export class StartEventAttemptDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
