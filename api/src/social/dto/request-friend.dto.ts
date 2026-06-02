import { IsUUID } from 'class-validator';

export class RequestFriendDto {
  @IsUUID()
  userId!: string;
}
