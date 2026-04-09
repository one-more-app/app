import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class OAuthStartDto {
  @IsString()
  redirectUri!: string;

  @IsString()
  codeChallenge!: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class OAuthCallbackDto {
  @IsString()
  code!: string;

  @IsString()
  redirectUri!: string;

  @IsString()
  codeVerifier!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

