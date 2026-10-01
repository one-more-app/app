import { IsBoolean } from 'class-validator';

export class SetRankingOptInDto {
  @IsBoolean()
  enabled!: boolean;
}
