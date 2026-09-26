import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { renderAccountDeletionEmail } from './emails/account-deletion-template.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = resolve(__dirname, '../emails/assets/logo-black-text.png');
const FONT_WOFF2_PATH = resolve(
  __dirname,
  '../event/emails/fonts/TBJ-One-More.woff2',
);

const LOGO_CID = 'one-more-logo';
const SUPPORT_EMAIL = 'admin@one-more.app';

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim() ?? '';
  const portRaw = process.env.SMTP_PORT?.trim() ?? '587';
  const port = Number(portRaw);
  const user = process.env.SMTP_USER?.trim() ?? '';
  const pass = process.env.SMTP_PASS?.trim() ?? '';
  const from =
    process.env.SMTP_FROM?.trim() || 'One More <noreply@one-more.app>';

  if (!host || !Number.isFinite(port) || port <= 0 || !user || !pass) {
    return null;
  }

  return { host, port, user, pass, from };
}

@Injectable()
export class AccountDeletionMailService {
  private readonly logger = new Logger(AccountDeletionMailService.name);
  private fontDataUriCache: string | null = null;

  async sendConfirmation(params: {
    to: string;
    firstName: string | null;
  }): Promise<void> {
    const smtp = readSmtpConfig();
    if (!smtp) {
      this.logger.warn(
        'SMTP non configuré — email de suppression de compte ignoré.',
      );
      return;
    }

    const replyMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      'Retour après suppression de compte One More',
    )}`;

    let fontDataUri = '';
    try {
      fontDataUri = await this.getFontDataUri();
    } catch (err) {
      this.logger.warn('Police One More introuvable pour le mail', err);
    }

    const { subject, html, text } = renderAccountDeletionEmail({
      firstName: params.firstName?.trim() || 'athlète',
      logoSrc: `cid:${LOGO_CID}`,
      fontDataUri,
      replyMailto,
      supportEmail: SUPPORT_EMAIL,
    });

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const attachments: nodemailer.SendMailOptions['attachments'] = [];
    try {
      const logo = await readFile(LOGO_PATH);
      attachments.push({
        filename: 'logo-black-text.png',
        content: logo,
        cid: LOGO_CID,
        contentDisposition: 'inline',
      });
    } catch (err) {
      this.logger.warn('Logo mail introuvable — envoi sans logo CID', err);
    }

    await transporter.sendMail({
      from: smtp.from,
      to: params.to,
      replyTo: SUPPORT_EMAIL,
      subject,
      html,
      text,
      attachments,
    });
  }

  private async getFontDataUri(): Promise<string> {
    if (this.fontDataUriCache) return this.fontDataUriCache;
    const buf = await readFile(FONT_WOFF2_PATH);
    this.fontDataUriCache = `data:font/woff2;base64,${buf.toString('base64')}`;
    return this.fontDataUriCache;
  }
}
