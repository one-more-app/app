import {
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SESSION_REACTION_EMOJIS } from '../entities/session-reaction.entity.js';

export class ToggleSessionReactionDto {
  @IsString()
  @MaxLength(16)
  @IsIn([...SESSION_REACTION_EMOJIS])
  emoji!: string;

  @IsIn(['session', 'exercise'])
  targetType!: 'session' | 'exercise';

  /** clientId de l’exercice suivi (pas l’uuid interne). */
  @ValidateIf(
    (body: ToggleSessionReactionDto) => body.targetType === 'exercise',
  )
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  trackedExerciseId?: string;
}
