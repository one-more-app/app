import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PresenceStatus } from '../entities/presence-status.enum.js';

export class PresenceHeartbeatDto {
  @IsEnum(PresenceStatus)
  status!: PresenceStatus;

  @IsOptional()
  @IsString()
  exerciseName?: string;

  @IsOptional()
  @IsString()
  trackedExerciseId?: string;
}
