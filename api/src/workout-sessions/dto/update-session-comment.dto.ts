import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSessionCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body!: string;
}
