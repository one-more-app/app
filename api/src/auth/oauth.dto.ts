import { IsIn, IsOptional, IsString } from 'class-validator';

export class OAuthStartDto {
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @IsString()
  codeChallenge!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

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

  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class GoogleIdTokenDto {
  @IsString()
  idToken!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @IsOptional()
  @IsString()
  deviceId?: string;
}
