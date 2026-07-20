import { IsInt, Max, Min } from 'class-validator';

export class PatchEventAttemptRepsDto {
  @IsInt()
  @Min(0)
  @Max(9999)
  reps!: number;
}
