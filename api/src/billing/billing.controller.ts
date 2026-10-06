import { Body, Controller, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { BillingService } from './billing.service.js';
import { RevenueCatWebhookGuard } from './guards/revenuecat-webhook.guard.js';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('/webhooks/revenuecat')
  @UseGuards(RevenueCatWebhookGuard)
  async revenueCatWebhook(@Body() body: Record<string, unknown>) {
    await this.billingService.handleRevenueCatWebhook(body);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/me/billing/sync')
  async syncPremium(
    @Req() req: { user: { sub: string } },
    @Query('force') force?: string,
  ) {
    const forceLookup = force === '1' || force === 'true';
    return await this.billingService.syncPremiumFromRevenueCat(req.user.sub, {
      force: forceLookup,
    });
  }
}
