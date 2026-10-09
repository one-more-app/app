import { Injectable, Logger } from '@nestjs/common';
import type { SesSendParams } from './ses-mailer.service.js';
import { SesMailerService } from './ses-mailer.service.js';
import { SmtpMailerService } from './smtp-mailer.service.js';

export type OutboundMailSendParams = SesSendParams;

@Injectable()
export class OutboundMailerService {
  private readonly logger = new Logger(OutboundMailerService.name);

  constructor(
    private readonly ses: SesMailerService,
    private readonly smtp: SmtpMailerService,
  ) {}

  isConfigured(): boolean {
    return this.ses.isConfigured() || this.smtp.isConfigured();
  }

  /** SES si configuré, sinon relais SMTP (SMTP_*). */
  async send(params: OutboundMailSendParams): Promise<string | null> {
    if (this.ses.isConfigured()) {
      return this.ses.send(params);
    }

    if (this.smtp.isConfigured()) {
      this.logger.debug('SES absent — envoi outbound via SMTP');
      return this.smtp.send({
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        unsubscribeToken: params.unsubscribeToken,
      });
    }

    this.logger.warn('Aucun transport email (SES ni SMTP) — email ignoré');
    return null;
  }
}
