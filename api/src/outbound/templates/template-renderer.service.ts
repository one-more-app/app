import { Injectable } from '@nestjs/common';
import { renderTransactionalEmail } from '../../emails/transactional-layout.js';
import type { PushPayload } from '../../notifications/dto/push-payload.dto.js';
import { NotificationType } from '../../notifications/entities/notification-type.enum.js';
import type { MessageTemplateEntity } from '../entities/message-template.entity.js';
import { buildUnsubscribeUrl } from '../lib/public-api-url.js';
import { interpolateTemplateString } from './template-interpolation.js';

const MARKETING_LOGO_SRC =
  'https://one-more.app/_next/image?url=%2Fapi%2Fcms-assets%2Fc0534ae2-e030-40d4-92fc-086df7fdf369%3Fv%3D1788202288452&w=256&q=75';

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class TemplateRendererService {
  renderEmail(params: {
    template: MessageTemplateEntity;
    variables: Record<string, string | number | boolean>;
    firstName: string;
    fontDataUri: string;
    unsubscribeToken: string | null;
    managePreferencesUrl: string;
  }): RenderedEmail {
    const email = params.template.content.email;
    if (!email) {
      throw new Error(`Template ${params.template.key} sans contenu email`);
    }

    const declared = params.template.variables;
    const vars = params.variables;

    const subject = interpolateTemplateString(email.subject, vars, declared);
    const preheader = interpolateTemplateString(
      email.preheader,
      vars,
      declared,
    );
    const eyebrow = interpolateTemplateString(email.eyebrow, vars, declared);
    const title = interpolateTemplateString(email.title, vars, declared);
    const bodyHtml = interpolateTemplateString(email.bodyHtml, vars, declared, {
      escapeForHtml: false,
    });
    const bodyText = interpolateTemplateString(email.bodyText, vars, declared);

    let cta = email.cta;
    if (cta) {
      cta = {
        label: interpolateTemplateString(cta.label, vars, declared),
        href: interpolateTemplateString(cta.href, vars, declared),
      };
    }

    const secondaryText = email.secondaryText
      ? interpolateTemplateString(email.secondaryText, vars, declared)
      : undefined;

    const footerLinks =
      params.template.category === 'marketing' && params.unsubscribeToken
        ? [
            {
              label: 'Se désinscrire',
              href: buildUnsubscribeUrl(params.unsubscribeToken),
            },
            {
              label: 'Gérer mes préférences',
              href: params.managePreferencesUrl,
            },
          ]
        : undefined;

    return renderTransactionalEmail({
      subject,
      preheader,
      logoSrc: MARKETING_LOGO_SRC,
      fontDataUri: params.fontDataUri,
      eyebrow,
      title,
      firstName: params.firstName,
      bodyHtml,
      bodyText,
      cta,
      secondaryText,
      footerLinks,
    });
  }

  renderPush(params: {
    template: MessageTemplateEntity;
    variables: Record<string, string | number | boolean>;
    dedupKey: string;
    notificationType?: NotificationType;
  }): PushPayload {
    const push = params.template.content.push;
    if (!push) {
      throw new Error(`Template ${params.template.key} sans contenu push`);
    }
    const declared = params.template.variables;
    const vars = params.variables;

    return {
      type: params.notificationType ?? NotificationType.OutboundMarketing,
      title: interpolateTemplateString(push.title, vars, declared),
      body: interpolateTemplateString(push.body, vars, declared),
      route: interpolateTemplateString(push.route, vars, declared),
      dedupKey: params.dedupKey,
    };
  }

  resolveChannel(
    template: MessageTemplateEntity,
    requested: 'email' | 'push' | 'auto',
  ): 'email' | 'push' {
    if (requested === 'email' || requested === 'push') {
      return requested;
    }
    if (template.channel === 'email') return 'email';
    if (template.channel === 'push') return 'push';
    if (template.content.push && !template.content.email) return 'push';
    if (template.content.email && !template.content.push) return 'email';
    return 'push';
  }
}
