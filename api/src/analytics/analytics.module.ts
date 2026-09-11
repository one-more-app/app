import { Global, Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { RedditConversionsService } from './reddit-conversions.service.js';

@Global()
@Module({
  providers: [AnalyticsService, RedditConversionsService],
  exports: [AnalyticsService, RedditConversionsService],
})
export class AnalyticsModule {}
