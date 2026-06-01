import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class IdentifyDto {
  @IsEmail()
  email!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

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
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class LogoutDto {
  @IsString()
  refreshToken!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
