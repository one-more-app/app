import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
  IdentifyDto,
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
} from './auth.dto.js';
import { JwtAuthGuard } from './jwt.guard.js';

@Controller()
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('/auth/identify')
  async identify(@Body() body: IdentifyDto) {
    return await this.auth.identifyEmail(body.email);
  }

  @Post('/auth/register')
  async register(@Body() body: RegisterDto) {
    return await this.auth.registerWithEmail(body);
  }

  @Post('/auth/login')
  async login(@Body() body: LoginDto) {
    return await this.auth.loginWithEmail(body);
  }

  @Post('/auth/refresh')
  async refresh(@Body() body: RefreshDto) {
    return await this.auth.refresh(body);
  }

  @Post('/auth/logout')
  async logout(@Body() body: LogoutDto) {
    await this.auth.logout(body);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async me(@Req() req: any) {
    return await this.auth.me(req.user.sub);
  }
}

