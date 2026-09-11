import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RedditAdsMatchDto {
  /** Click ID Reddit (`rdt_cid`) si l’utilisateur vient d’une pub. */
  @IsOptional()
  @IsString()
  redditClickId?: string;

  @IsOptional()
  @IsString()
  idfa?: string;

  @IsOptional()
  @IsString()
  aaid?: string;
}

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

export class OAuthCallbackDto extends RedditAdsMatchDto {
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

  @IsOptional()
  @IsString()
  inviteCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female';
}

export class GoogleIdTokenDto extends RedditAdsMatchDto {
  @IsString()
  idToken!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  inviteCode?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female';
}

export class AppleIdTokenDto extends RedditAdsMatchDto {
  @IsString()
  idToken!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  inviteCode?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female';
}
