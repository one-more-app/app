import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchUsersQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q!: string;
}
