import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  AppleIdTokenDto,
  GoogleIdTokenDto,
  OAuthCallbackDto,
  OAuthStartDto,
} from './oauth.dto.js';
import { OAuthService } from './oauth.service.js';

@Controller('/oauth')
export class OAuthController {
  constructor(private oauth: OAuthService) {}

  @Post('/google/id-token')
  async googleIdToken(@Body() body: GoogleIdTokenDto) {
    return await this.oauth.signInWithGoogleIdToken(body);
  }

  @Post('/apple/id-token')
  async appleIdToken(@Body() body: AppleIdTokenDto) {
    return await this.oauth.signInWithAppleIdToken(body);
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
  ) {
    return await this.oauth.callback(provider, body);
  }
}
