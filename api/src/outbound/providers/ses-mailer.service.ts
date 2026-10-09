import {
  SendEmailCommand,
  SESv2Client,
  type MessageTag,
} from '@aws-sdk/client-sesv2';
import { Injectable, Logger } from '@nestjs/common';
import { buildUnsubscribeUrl } from '../lib/public-api-url.js';

export type SesSendParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeToken: string | null;
  tags: Record<string, string>;
};

@Injectable()
export class SesMailerService {
  private readonly logger = new Logger(SesMailerService.name);
  private readonly client: SESv2Client | null;
  private readonly fromAddress: string | null;
  private readonly configurationSet: string | null;
  private readonly unsubscribeMailto: string | null;

  constructor() {
    const region = process.env.AWS_SES_REGION?.trim();
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY?.trim();
    this.fromAddress = process.env.SES_FROM_ADDRESS?.trim() ?? null;
    this.configurationSet = process.env.SES_CONFIGURATION_SET?.trim() ?? null;
    this.unsubscribeMailto =
      process.env.SES_UNSUBSCRIBE_MAILTO?.trim() ?? 'mailto:admin@one-more.app';

    if (!region || !accessKeyId || !secretAccessKey || !this.fromAddress) {
      this.client = null;
      return;
    }

    this.client = new SESv2Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async send(params: SesSendParams): Promise<string | null> {
    if (!this.client || !this.fromAddress) {
      this.logger.warn('SES non configuré — email ignoré');
      return null;
    }

    const emailTags: MessageTag[] = Object.entries(params.tags).map(
      ([Name, Value]) => ({ Name, Value: Value.slice(0, 256) }),
    );

    const headers: Array<{ Name: string; Value: string }> = [];
    if (params.unsubscribeToken) {
      const httpsUrl = buildUnsubscribeUrl(params.unsubscribeToken);
      headers.push({
        Name: 'List-Unsubscribe',
        Value: `<${httpsUrl}>, <${this.unsubscribeMailto}>`,
      });
      headers.push({
        Name: 'List-Unsubscribe-Post',
        Value: 'List-Unsubscribe=One-Click',
      });
    }

    const command = new SendEmailCommand({
      FromEmailAddress: this.fromAddress,
      Destination: { ToAddresses: [params.to] },
      ConfigurationSetName: this.configurationSet ?? undefined,
      EmailTags: emailTags,
      Content: {
        Simple: {
          Subject: { Data: params.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: params.html, Charset: 'UTF-8' },
            Text: { Data: params.text, Charset: 'UTF-8' },
          },
          Headers: headers.length > 0 ? headers : undefined,
        },
      },
    });

    const result = await this.client.send(command);
    return result.MessageId ?? null;
  }
}
