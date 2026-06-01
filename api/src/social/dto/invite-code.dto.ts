import { IsString, MinLength } from 'class-validator';

export class InviteCodeDto {
  @IsString()
  @MinLength(4)
  inviteCode!: string;
}
