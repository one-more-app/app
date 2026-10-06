import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { readSmtpConfig } from '../../emails/smtp-config.js';
import { buildUnsubscribeUrl } from '../lib/public-api-url.js';

export type SmtpSendParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeToken: string | null;
};

@Injectable()
export class SmtpMailerService {
  private readonly logger = new Logger(SmtpMailerService.name);
  private readonly unsubscribeMailto: string;

  constructor() {
    this.unsubscribeMailto =
      process.env.SES_UNSUBSCRIBE_MAILTO?.trim() ?? 'mailto:admin@one-more.app';
  }

  isConfigured(): boolean {
    return readSmtpConfig() !== null;
  }

  async send(params: SmtpSendParams): Promise<string | null> {
    const smtp = readSmtpConfig();
    if (!smtp) {
      this.logger.warn('SMTP non configuré — email ignoré');
      return null;
    }

    const headers: Record<string, string> = {};
    if (params.unsubscribeToken) {
      const httpsUrl = buildUnsubscribeUrl(params.unsubscribeToken);
      headers['List-Unsubscribe'] =
        `<${httpsUrl}>, <${this.unsubscribeMailto}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const result = await transporter.sendMail({
      from: smtp.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    return result.messageId ?? null;
  }
}
