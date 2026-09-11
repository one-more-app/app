import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AppleIdTokenDto,
  GoogleIdTokenDto,
  OAuthCallbackDto,
  OAuthStartDto,
} from './oauth.dto.js';
import { OAuthService } from './oauth.service.js';
import { redditAdsFromRequest } from './reddit-ads-request.js';

@Controller('/oauth')
export class OAuthController {
  constructor(private oauth: OAuthService) {}

  @Post('/google/id-token')
  async googleIdToken(@Body() body: GoogleIdTokenDto, @Req() req: Request) {
    return await this.oauth.signInWithGoogleIdToken({
      ...body,
      ads: redditAdsFromRequest(req, body),
    });
  }

  @Post('/apple/id-token')
  async appleIdToken(@Body() body: AppleIdTokenDto, @Req() req: Request) {
    return await this.oauth.signInWithAppleIdToken({
      ...body,
      ads: redditAdsFromRequest(req, body),
    });
  }

  @Post('/:provider/start')
  start(
    @Param('provider') provider: 'google' | 'apple',
    @Body() body: OAuthStartDto,
  ) {
    return this.oauth.start(provider, body);
  }

  @Post('/:provider/callback')
  async callback(
    @Param('provider') provider: 'google' | 'apple',
    @Body() body: OAuthCallbackDto,
    @Req() req: Request,
  ) {
    return await this.oauth.callback(provider, {
      ...body,
      ads: redditAdsFromRequest(req, body),
    });
  }
}
