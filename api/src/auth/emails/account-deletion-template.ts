import { renderTransactionalEmail } from '../../emails/transactional-layout.js';

/** Logo wordmark blanc (fond transparent). Le layout le pose sur un bandeau noir. */
const ACCOUNT_DELETION_LOGO_SRC =
  'https://one-more.app/_next/image?url=%2Fapi%2Fcms-assets%2Fc0534ae2-e030-40d4-92fc-086df7fdf369%3Fv%3D1788202288452&w=256&q=75';

export type AccountDeletionTemplateInput = {
  firstName: string;
  /**
   * Data URI woff2 (`data:font/woff2;base64,...`).
   * Obligatoire pour un rendu fiable : les URLs HTTPS du site n'ont pas de CORS.
   */
  fontDataUri: string;
  /** Mailto CTA pour répondre avec un retour. */
  replyMailto: string;
  supportEmail: string;
};

export function buildAccountDeletionSubject(): string {
  return 'Ton compte One More a été supprimé';
}

export function renderAccountDeletionEmail(
  input: AccountDeletionTemplateInput,
): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = input.firstName.trim() || 'athlète';
  const supportEmail = input.supportEmail.trim();

  const bodyText = [
    'Ton compte One More a bien été supprimé, comme demandé.',
    'Tes données associées ne sont plus accessibles via ce compte.',
    '',
    'On aimerait comprendre ce qui n’a pas fonctionné pour toi.',
    'Réponds simplement à cet email et dis-nous ce qui ne te convenait pas, ça nous aide vraiment à améliorer One More.',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 12px 0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; font-weight:500; line-height:1.55; color:#3A3A3A;">
      Ton compte One More a bien été <strong style="color:#0A0A0A;">supprimé</strong>, comme demandé.
    </p>
    <p style="margin:0 0 12px 0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; font-weight:500; line-height:1.55; color:#3A3A3A;">
      Tes données associées ne sont plus accessibles via ce compte.
    </p>
    <p style="margin:0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; font-weight:500; line-height:1.55; color:#3A3A3A;">
      On aimerait comprendre ce qui n’a pas fonctionné pour toi. Réponds à cet email, même en deux lignes, pour nous aider à faire mieux.
    </p>`;

  return renderTransactionalEmail({
    subject: buildAccountDeletionSubject(),
    preheader:
      'Confirmation de suppression : dis-nous ce qui n’allait pas si tu as 30 secondes.',
    logoSrc: ACCOUNT_DELETION_LOGO_SRC,
    fontDataUri: input.fontDataUri,
    eyebrow: 'Compte',
    title: 'Suppression confirmée',
    firstName,
    bodyHtml,
    bodyText,
    cta: { label: 'Répondre', href: input.replyMailto.trim() },
    secondaryText: `Ou écris à ${supportEmail}`,
  });
}
