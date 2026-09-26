export type TransactionalEmailInfo = {
  label: string;
  value: string;
};

export type TransactionalEmailCta = {
  label: string;
  href: string;
};

export type TransactionalEmailFooterLink = {
  label: string;
  href: string;
};

export type TransactionalEmailInput = {
  subject: string;
  preheader: string;
  logoSrc: string;
  /**
   * Data URI woff2 (`data:font/woff2;base64,...`).
   * Obligatoire pour un rendu fiable : les URLs HTTPS du site n'ont pas de CORS.
   */
  fontDataUri: string;
  eyebrow: string;
  title: string;
  firstName: string;
  /** HTML déjà échappé / contrôlé (paragraphes). */
  bodyHtml: string;
  /** Texte brut pour la partie body (variante text/plain). */
  bodyText: string;
  info?: TransactionalEmailInfo;
  cta?: TransactionalEmailCta;
  secondaryText?: string;
  footerLinks?: TransactionalEmailFooterLink[];
};

const ONE_MORE_FONT_WOFF2 =
  'https://site.one-more.app/assets/fonts/TBJ-One-More.woff2';
const ONE_MORE_FONT_WOFF =
  'https://site.one-more.app/assets/fonts/TBJ-One-More.woff';
const ONE_MORE_FONT_TTF =
  'https://site.one-more.app/assets/fonts/OneMore-ExtraBold.ttf';

const ACCENT = '#dfff5e';
const BG = '#F3F3F3';
const TEXT = '#0A0A0A';
const MUTED = '#8A8A8A';
const BODY = '#3A3A3A';
const PILL_BG = '#F0F0F0';

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildOneMoreFontFaceCss(fontDataUri: string): string {
  const dataUri = fontDataUri.trim();
  const primarySrc = dataUri
    ? `url('${dataUri}') format('woff2'),\n         `
    : '';
  return `@font-face {
    font-family: 'One More';
    src: ${primarySrc}url('${ONE_MORE_FONT_WOFF2}') format('woff2'),
         url('${ONE_MORE_FONT_WOFF}') format('woff'),
         url('${ONE_MORE_FONT_TTF}') format('truetype');
    font-weight: 700 900;
    font-style: normal;
    font-display: swap;
  }`;
}

/** Remplissage invisible pour que les clients mail n'ajoutent pas le corps au preview. */
const PREHEADER_FILLER = Array.from({ length: 120 })
  .map(() => '&#847;&zwnj;')
  .join('');

function renderPreheader(text: string): string {
  return `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:${TEXT}; opacity:0;">
  ${escapeHtml(text)}${PREHEADER_FILLER}
</div>`;
}

function renderInfoRow(info: TransactionalEmailInfo): string {
  const label = escapeHtml(info.label);
  const value = escapeHtml(info.value);
  return `
        <tr>
          <td style="padding:0 28px 20px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:${PILL_BG}; border-radius:999px;">
              <tr>
                <td style="padding:12px 18px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; font-weight:500; color:${MUTED};">
                  ${label}
                </td>
                <td align="right" style="padding:12px 18px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; font-weight:600; color:${TEXT};">
                  ${value}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}

function renderCta(cta: TransactionalEmailCta): string {
  const label = escapeHtml(cta.label);
  const href = escapeHtml(cta.href);
  return `
        <tr>
          <td style="padding:0 28px 24px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
              <tr>
                <td align="center" bgcolor="${TEXT}" style="border-radius:12px; background-color:${TEXT};">
                  <a href="${href}" style="display:block; padding:16px 24px; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-style:italic; font-size:15px; font-weight:900; letter-spacing:0.04em; color:#FFFFFF; text-decoration:none; text-transform:uppercase;">
                    ${label}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}

function renderSecondary(secondaryText: string): string {
  const text = escapeHtml(secondaryText);
  return `
        <tr>
          <td style="padding:0 28px 8px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
              <tr>
                <td style="border-top:1px solid #E8E8E8; font-size:0; line-height:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 28px 28px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; font-weight:500; line-height:1.5; color:${MUTED};">
            ${text}
          </td>
        </tr>`;
}

function renderFooterLinks(
  links: TransactionalEmailFooterLink[],
): string {
  if (links.length === 0) return '';
  const parts = links.map((link, index) => {
    const label = escapeHtml(link.label);
    const href = escapeHtml(link.href);
    const sep =
      index < links.length - 1
        ? `<span style="color:${MUTED};"> · </span>`
        : '';
    return `<a href="${href}" style="color:${MUTED}; text-decoration:underline;">${label}</a>${sep}`;
  });
  return `
          <tr>
            <td align="center" style="padding:8px 20px 0 20px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:11px; line-height:1.5;">
              ${parts.join('')}
            </td>
          </tr>`;
}

function buildPlainText(input: TransactionalEmailInput): string {
  const firstName = input.firstName.trim() || 'athlète';
  const lines = [
    input.eyebrow.trim(),
    input.title.trim(),
    '',
    `Salut ${firstName},`,
    '',
    input.bodyText.trim(),
  ];

  if (input.info) {
    lines.push('', `${input.info.label}: ${input.info.value}`);
  }
  if (input.cta) {
    lines.push('', `${input.cta.label}: ${input.cta.href}`);
  }
  if (input.secondaryText?.trim()) {
    lines.push('', input.secondaryText.trim());
  }

  lines.push('', 'ALWAYS ONE MORE', '', 'One More SAS - Paris, France');

  if (input.footerLinks && input.footerLinks.length > 0) {
    lines.push(
      '',
      input.footerLinks.map((l) => `${l.label}: ${l.href}`).join(' · '),
    );
  }

  return lines.join('\n');
}

export function renderTransactionalEmail(input: TransactionalEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = input.subject.trim();
  const firstNameRaw = input.firstName.trim() || 'athlète';
  const firstName = escapeHtml(firstNameRaw);
  const logoSrc = escapeHtml(input.logoSrc);
  const eyebrow = escapeHtml(input.eyebrow.trim());
  const title = escapeHtml(input.title.trim());
  const fontFaceCss = buildOneMoreFontFaceCss(input.fontDataUri);
  const subjectEscaped = escapeHtml(subject);

  const infoBlock = input.info ? renderInfoRow(input.info) : '';
  const ctaBlock = input.cta ? renderCta(input.cta) : '';
  const secondaryBlock = input.secondaryText?.trim()
    ? renderSecondary(input.secondaryText.trim())
    : '';
  const footerLinksBlock =
    input.footerLinks && input.footerLinks.length > 0
      ? renderFooterLinks(input.footerLinks)
      : '';
  const bodyBottomPad =
    infoBlock || ctaBlock || secondaryBlock ? '20px' : '28px';

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${subjectEscaped}</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet">
<style>
  @import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap");
  ${fontFaceCss}
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; }
  body {
    margin: 0;
    padding: 0;
    width: 100% !important;
    height: 100% !important;
    background-color: ${BG};
    font-family: 'Hanken Grotesk', Arial, Helvetica, sans-serif;
  }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media only screen and (max-width: 620px) {
    .om-container { width: 100% !important; }
    .om-card-px { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${BG};">
${renderPreheader(input.preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:${BG};">
  <tr>
    <td align="center" style="padding:32px 16px 40px 16px;">
      <table role="presentation" class="om-container" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px; max-width:520px;">
        <tr>
          <td align="center" style="padding:0 0 20px 0;">
            <img src="${logoSrc}" width="40" height="40" alt="One More" style="display:block; width:40px; max-width:40px; height:auto;">
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF; border-radius:16px; overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
              <tr>
                <td style="padding:0; line-height:0; font-size:0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="28" height="4" bgcolor="${ACCENT}" style="width:28px; height:4px; background-color:${ACCENT}; font-size:0; line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="om-card-px" style="padding:28px 28px 8px 28px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; font-weight:500; letter-spacing:0.02em; color:${MUTED};">
                  ${eyebrow}
                </td>
              </tr>
              <tr>
                <td class="om-card-px" style="padding:0 28px 20px 28px; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-style:italic; font-size:28px; font-weight:900; line-height:1.15; color:${TEXT};">
                  ${title}
                </td>
              </tr>
              <tr>
                <td class="om-card-px" style="padding:0 28px 12px 28px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; font-weight:500; line-height:1.55; color:${BODY};">
                  Salut ${firstName},
                </td>
              </tr>
              <tr>
                <td class="om-card-px" style="padding:0 28px ${bodyBottomPad} 28px;">
                  ${input.bodyHtml}
                </td>
              </tr>
              ${infoBlock}
              ${ctaBlock}
              ${secondaryBlock}
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 20px 0 20px; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-style:italic; font-size:14px; font-weight:900; letter-spacing:0.04em; color:${TEXT}; text-transform:uppercase;">
            ALWAYS ONE MORE
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 20px 0 20px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:11px; line-height:1.5; color:${MUTED};">
            Email automatique envoyé par One More. Merci de ne pas y répondre.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 20px 0 20px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:11px; line-height:1.5; color:${MUTED};">
            One More SAS - Paris, France
          </td>
        </tr>
        ${footerLinksBlock}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return {
    subject,
    html,
    text: buildPlainText(input),
  };
}
