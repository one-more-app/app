import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserProgressEntity } from '../progress/entities/user-progress.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationPreferencesEntity } from '../notifications/entities/notification-preferences.entity.js';
import { OutboundCatalogService } from './catalog/outbound-catalog.service.js';
import { ConsentService } from './consent/consent.service.js';
import { UnsubscribeController } from './consent/unsubscribe.controller.js';
import { OutboundDispatchService } from './dispatch/outbound-dispatch.service.js';
import { OutboundSendService } from './dispatch/outbound-send.service.js';
import { OutboundWorkerService } from './dispatch/outbound-worker.service.js';
import { EmailSuppressionEntity } from './entities/email-suppression.entity.js';
import { MessageTemplateEntity } from './entities/message-template.entity.js';
import { OutboundDispatchEntity } from './entities/outbound-dispatch.entity.js';
import { OutboundMessageEntity } from './entities/outbound-message.entity.js';
import { SesWebhookController } from './feedback/ses-webhook.controller.js';
import { SnsMessageValidatorService } from './feedback/sns-message-validator.service.js';
import { OutboundApiKeyGuard } from './guards/outbound-api-key.guard.js';
import { MarketingMessageVarsService } from './lib/marketing-message-vars.service.js';
import { OutboundInternalController } from './outbound-internal.controller.js';
import { EmailFontService } from './providers/email-font.service.js';
import { OutboundMailerService } from './providers/outbound-mailer.service.js';
import { SesMailerService } from './providers/ses-mailer.service.js';
import { SmtpMailerService } from './providers/smtp-mailer.service.js';
import { SegmentRegistryService } from './segments/segment-registry.service.js';
import { TemplateRendererService } from './templates/template-renderer.service.js';
import { TemplateService } from './templates/template.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailSuppressionEntity,
      MessageTemplateEntity,
      OutboundMessageEntity,
      OutboundDispatchEntity,
      UserEntity,
      UserProfileEntity,
      UserProgressEntity,
      PerformanceEntryEntity,
      XpEventEntity,
      NotificationPreferencesEntity,
    ]),
    AnalyticsModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    UnsubscribeController,
    OutboundInternalController,
    SesWebhookController,
  ],
  providers: [
    ConsentService,
    OutboundCatalogService,
    TemplateService,
    TemplateRendererService,
    OutboundSendService,
    OutboundDispatchService,
    OutboundWorkerService,
    SegmentRegistryService,
    SesMailerService,
    SmtpMailerService,
    OutboundMailerService,
    EmailFontService,
    SnsMessageValidatorService,
    OutboundApiKeyGuard,
    MarketingMessageVarsService,
  ],
  exports: [ConsentService, OutboundSendService, MarketingMessageVarsService],
})
export class OutboundModule {}
