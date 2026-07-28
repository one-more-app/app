export type EventThankYouNeighbor = {
  rank: number;
  displayName: string;
  reps: number;
};

export type EventThankYouRankRow = {
  exerciseLabel: string;
  genderLabel: string;
  rank: number;
  reps: number;
  displayName: string;
  /** Nombre de participants sur ce classement (exercice · genre). */
  participantCount: number;
  /** Personne juste au-dessus (rang inférieur). */
  above: EventThankYouNeighbor | null;
  /** Personne juste en-dessous (rang supérieur). */
  below: EventThankYouNeighbor | null;
  /** #1 du board. Affiché séparément seulement si ton rang > 2. */
  top: EventThankYouNeighbor | null;
};

export type EventThankYouTemplateInput = {
  firstName: string;
  ranks: EventThankYouRankRow[];
  logoSrc: string;
  humanSrc: string;
  mockupSrc: string;
  /**
   * Data URI woff2 (`data:font/woff2;base64,...`).
   * Obligatoire pour un rendu fiable : les URLs HTTPS du site n'ont pas de CORS.
   */
  fontDataUri: string;
  /** Lien CTA téléchargement (OneLink AppsFlyer). */
  downloadUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  publicAppUrl: string;
};

const EVENT_SITE_URL = 'https://site.one-more.app';
const EVENT_NAME = 'Delta, Bravo.';
const EVENT_INTRO_COPY =
  'Tu as brillé dimanche au delta, découvre le classement complet du stand ONE MORE. Découvre en exclusivité notre app pour continuer à battre tes records.';

export function buildEventThankYouSubject(
  ranks: EventThankYouRankRow[],
): string {
  if (ranks.length === 0) return `Ton record au ${EVENT_NAME}`;

  const summary = [...ranks]
    .sort((a, b) => a.exerciseLabel.localeCompare(b.exerciseLabel, 'fr'))
    .map((row) => `${row.reps} ${row.exerciseLabel.toLowerCase()}`)
    .join(', ');

  return `${summary} au ${EVENT_NAME}`;
}

const ONE_MORE_FONT_WOFF2 =
  'https://site.one-more.app/assets/fonts/TBJ-One-More.woff2';
const ONE_MORE_FONT_WOFF =
  'https://site.one-more.app/assets/fonts/TBJ-One-More.woff';
const ONE_MORE_FONT_TTF =
  'https://site.one-more.app/assets/fonts/OneMore-ExtraBold.ttf';

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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Remplissage invisible pour que les clients mail n'ajoutent pas le corps au preview. */
const PREHEADER_FILLER = Array.from({ length: 120 })
  .map(() => '&#847;&zwnj;')
  .join('');

function renderPreheader(text: string): string {
  return `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#0A0A0A; opacity:0;">
  ${escapeHtml(text)}${PREHEADER_FILLER}
</div>`;
}

function renderLeaderboardLine(params: {
  rank: number;
  displayName: string;
  reps: number;
  highlight?: boolean;
  label?: string;
}): string {
  const name = escapeHtml(params.displayName);
  const label = params.label ? escapeHtml(params.label) : '';
  const rowBg = params.highlight
    ? 'background-color:#dfff5e; border-radius:10px;'
    : '';
  const rankColor = params.highlight ? '#0A0A0A' : '#9A9A9A';
  const nameColor = params.highlight ? '#0A0A0A' : '#D4D4D4';
  const nameWeight = params.highlight ? '700' : '500';
  const repsStyle = params.highlight
    ? `font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-style:italic; font-size:18px; font-weight:900; color:#0A0A0A;`
    : `font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; color:#9A9A9A;`;

  return `
              <tr>
                <td colspan="2" width="100%" style="width:100%; padding:4px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; table-layout:fixed; ${rowBg}">
                    <tr>
                      <td width="52" valign="middle" style="width:52px; padding:10px 0 10px 14px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:13px; font-weight:${params.highlight ? '800' : '700'}; color:${rankColor}; white-space:nowrap;">
                        #${params.rank}
                      </td>
                      <td valign="middle" style="padding:10px 12px 10px 0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:14px; font-weight:${nameWeight}; color:${nameColor};">
                        ${name}${label ? ` <span style="font-weight:600; opacity:${params.highlight ? '0.7' : '1'}; color:${params.highlight ? '#0A0A0A' : '#9A9A9A'};">${label}</span>` : ''}
                      </td>
                      <td width="88" valign="middle" align="right" style="width:88px; padding:10px 14px 10px 0; white-space:nowrap; ${repsStyle}">
                        ${params.reps}${params.highlight ? ` <span style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-style:normal; font-size:12px; font-weight:600;">reps</span>` : ' reps'}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

function renderPerformanceCards(ranks: EventThankYouRankRow[]): string {
  return ranks
    .map((row, index) => {
      const isLast = index === ranks.length - 1;
      const paddingBottom = isLast ? '6px' : '14px';
      const title = `${row.exerciseLabel} · ${row.genderLabel}`;
      const showTopApart = row.rank > 2 && row.top != null;

      const lines: string[] = [];
      if (showTopApart && row.top) {
        lines.push(
          renderLeaderboardLine({
            rank: row.top.rank,
            displayName: row.top.displayName,
            reps: row.top.reps,
            label: '· record',
          }),
        );
        lines.push(`
              <tr>
                <td colspan="2" align="center" style="padding:2px 0 6px 0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; color:#5A5A5A; letter-spacing:2px;">
                  ···
                </td>
              </tr>`);
      }
      if (row.above) {
        lines.push(
          renderLeaderboardLine({
            rank: row.above.rank,
            displayName: row.above.displayName,
            reps: row.above.reps,
          }),
        );
      }
      lines.push(
        renderLeaderboardLine({
          rank: row.rank,
          displayName: row.displayName,
          reps: row.reps,
          highlight: true,
          label: '· toi',
        }),
      );
      if (row.below) {
        lines.push(
          renderLeaderboardLine({
            rank: row.below.rank,
            displayName: row.below.displayName,
            reps: row.below.reps,
          }),
        );
      }

      const participantLabel =
        row.participantCount <= 1
          ? '1 participant'
          : `${row.participantCount} participants`;

      return `
  <tr>
    <td class="om-px" style="padding:0 20px ${paddingBottom} 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#161616; border-radius:14px;">
        <tr>
          <td style="padding:18px 16px 14px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
              <tr>
                <td width="100%" style="width:100%; padding:0 4px 4px 4px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; color:#9A9A9A; text-transform:uppercase;">${escapeHtml(title)}</td>
                <td align="right" style="padding:0 4px 4px 4px; white-space:nowrap;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td bgcolor="#dfff5e" style="border-radius:100px; padding:4px 12px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:11px; font-weight:800; color:#0A0A0A;">#${row.rank}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0 4px 12px 4px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; font-weight:500; color:#6E6E6E;">
                  ${escapeHtml(participantLabel)}
                </td>
              </tr>
${lines.join('\n')}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
    })
    .join('\n');
}

export function renderEventThankYouEmail(input: EventThankYouTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstNameRaw = input.firstName.trim() || 'athlète';
  const firstName = escapeHtml(firstNameRaw);
  const ranksHtml = renderPerformanceCards(input.ranks);
  const publicAppUrl = escapeHtml(EVENT_SITE_URL);
  const downloadUrl = escapeHtml(input.downloadUrl.trim());
  const logoSrc = escapeHtml(input.logoSrc);
  const humanSrc = escapeHtml(input.humanSrc);
  const mockupSrc = escapeHtml(input.mockupSrc);
  const fontFaceCss = buildOneMoreFontFaceCss(input.fontDataUri);
  const subject = buildEventThankYouSubject(input.ranks);
  const subjectEscaped = escapeHtml(subject);

  const ranksText = input.ranks
    .map((row) => {
      const bits = [
        `${row.exerciseLabel} ${row.genderLabel}`,
        row.rank > 2 && row.top
          ? `Record #1 ${row.top.displayName} (${row.top.reps} reps)`
          : null,
        row.above
          ? `#${row.above.rank} ${row.above.displayName} (${row.above.reps} reps)`
          : null,
        `#${row.rank} ${row.displayName} · toi (${row.reps} reps)`,
        row.below
          ? `#${row.below.rank} ${row.below.displayName} (${row.below.reps} reps)`
          : null,
        `${row.participantCount} participant${row.participantCount > 1 ? 's' : ''}`,
      ].filter(Boolean);
      return bits.join('\n  ');
    })
    .join('\n\n');

  const text = [
    `Bravo, ${firstNameRaw}.`,
    '',
    EVENT_INTRO_COPY,
    '',
    'Tes performances :',
    ranksText,
    '',
    "Ce n'est qu'un palier. Le prochain t'attend.",
    'Télécharge One More et rejoins le mouvement.',
    `Télécharger : ${input.downloadUrl.trim()}`,
    `iOS : ${input.appStoreUrl}`,
    `Android : ${input.playStoreUrl}`,
    '',
    'Toujours une rep de plus.',
    'One More · @one_more.app',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
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
    background-color: #0A0A0A;
    font-family: 'Hanken Grotesk', Arial, Helvetica, sans-serif;
  }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  .om-mockup-img {
    display: block;
    width: auto;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    margin: 0 auto;
    border-radius: 16px;
    object-fit: contain;
  }
  @media screen and (max-width: 600px) {
    .om-container { width: 100% !important; }
    .om-px { padding-left: 20px !important; padding-right: 20px !important; }
    .om-hero-title { font-size: 34px !important; line-height: 38px !important; }
    .om-stack { display: block !important; width: 100% !important; }
    .om-features-col { padding-right: 0 !important; padding-bottom: 20px !important; }
    .om-mockup-col { padding-top: 4px !important; height: auto !important; }
    .om-mockup-img { height: auto !important; width: 100% !important; max-width: 220px !important; }
    .om-rank-cell { padding-bottom: 10px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0A0A0A; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif;">
${renderPreheader(EVENT_INTRO_COPY)}

<center style="width:100%; background-color:#0A0A0A;">
<div style="max-width:600px; margin:0 auto;" class="om-container">
<!--[if mso]>
<table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
<![endif]-->

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; margin:0 auto; background-color:#0A0A0A;">

  <!-- LOGO / HEADER -->
  <tr>
    <td align="center" style="padding:32px 24px 20px 24px;">
      <img src="${logoSrc}" width="160" alt="One More" style="display:block; width:160px; max-width:70%; height:auto;">
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td class="om-px" style="padding:12px 32px 28px 32px;" align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="#dfff5e" style="border-radius:100px; padding:7px 16px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; color:#0A0A0A; text-transform:uppercase;">
                  Bilan de challenge
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" class="om-hero-title" style="font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:42px; line-height:46px; font-weight:900; font-style:italic; color:#F5F5F0; text-transform:uppercase; letter-spacing:-0.5px;">
            Bravo,<br>${firstName}.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #262626; font-size:0; line-height:0;">&nbsp;</td></tr></table></td>
  </tr>

  <!-- SECTION TITLE : PERFORMANCES -->
  <tr>
    <td class="om-px" style="padding:32px 32px 16px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; font-weight:700; letter-spacing:2px; color:#dfff5e; text-transform:uppercase;">
            Tes performances
          </td>
        </tr>
        <tr>
          <td style="padding-top:6px; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:22px; font-weight:900; font-style:italic; color:#F5F5F0; text-transform:uppercase;">
            Chaque rep a compté.
          </td>
        </tr>
      </table>
    </td>
  </tr>

${ranksHtml}

  <!-- MOTIVATION LINE -->
  <tr>
    <td class="om-px" style="padding:26px 32px 8px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#dfff5e; border-radius:14px;">
        <tr>
          <td style="padding:24px 24px;" align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:20px; font-weight:900; font-style:italic; color:#0A0A0A; text-transform:uppercase; line-height:24px;">
                  Ce n'est qu'un palier.<br>Le prochain t'attend.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:8px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:14px; color:#1C1C1C;">
                  Ta progression ne s'arrête pas au challenge. Rejoins le mouvement.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #262626; font-size:0; line-height:0; padding-top:34px;">&nbsp;</td></tr></table></td>
  </tr>

  <!-- APP INTRO -->
  <tr>
    <td class="om-px" style="padding:0 32px 8px 32px;" align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:14px; overflow:hidden;">
              <tr>
                <td>
                  <img
                    src="${humanSrc}"
                    alt="Marcus"
                    width="100%"
                    style="display:block; width:100%; max-width:100%; height:auto;"
                  />
                </td>
              </tr>
              <tr>
                <td
                  height="56"
                  style="height:56px; line-height:56px; font-size:0; background:#0a0a0a; background:linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.28) 18%, rgba(10,10,10,0.62) 52%, rgba(10,10,10,0.9) 78%, rgba(10,10,10,1) 100%);"
                >
                  &nbsp;
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:2px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; font-weight:700; letter-spacing:2px; color:#dfff5e; text-transform:uppercase;">
            Always One More
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:8px; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:26px; line-height:30px; font-weight:900; font-style:italic; color:#F5F5F0; text-transform:uppercase;">
            Rejoins le mouvement.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:10px; padding-bottom:26px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; line-height:22px; color:#9A9A9A;">
            Le challenge, c'était un aperçu. L'app, c'est le terrain d'entraînement. Continue à battre tes records.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BENEFITS + MOCKUP -->
  <tr>
    <td class="om-px" style="padding:0 32px 4px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="om-stack om-features-col" valign="top" width="58%" style="width:58%; padding-right:18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="height:1px; line-height:1px; font-size:0;">&nbsp;</td></tr>
              <tr>
                <td style="background-color:#161616; border-radius:12px; padding:16px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="40" valign="middle" align="center" style="width:40px; text-align:center; vertical-align:middle; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:16px; font-weight:900; font-style:italic; line-height:20px; color:#dfff5e;">01</td>
                    <td valign="middle" style="padding-left:6px; vertical-align:middle; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; line-height:20px; color:#F5F5F0;"><strong style="color:#F5F5F0;">Bats tes records</strong><br><span style="color:#9A9A9A;">Chaque perf est scorée, chaque palier est célébré.</span></td>
                  </tr></table>
                </td>
              </tr>
              <tr><td style="height:10px; line-height:10px; font-size:0;">&nbsp;</td></tr>
              <tr>
                <td style="background-color:#161616; border-radius:12px; padding:16px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="40" valign="middle" align="center" style="width:40px; text-align:center; vertical-align:middle; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:16px; font-weight:900; font-style:italic; line-height:20px; color:#dfff5e;">02</td>
                    <td valign="middle" style="padding-left:6px; vertical-align:middle; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; line-height:20px; color:#F5F5F0;"><strong style="color:#F5F5F0;">Suis ta progression</strong><br><span style="color:#9A9A9A;">Ton historique, tes 1RM, ta courbe. Jour après jour.</span></td>
                  </tr></table>
                </td>
              </tr>
              <tr><td style="height:10px; line-height:10px; font-size:0;">&nbsp;</td></tr>
              <tr>
                <td style="background-color:#161616; border-radius:12px; padding:16px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="40" valign="middle" align="center" style="width:40px; text-align:center; vertical-align:middle; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:16px; font-weight:900; font-style:italic; line-height:20px; color:#dfff5e;">03</td>
                    <td valign="middle" style="padding-left:6px; vertical-align:middle; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; line-height:20px; color:#F5F5F0;"><strong style="color:#F5F5F0;">Compare tes performances</strong><br><span style="color:#9A9A9A;">Ta ligue, ton rang, ta place parmi les pratiquants.</span></td>
                  </tr></table>
                </td>
              </tr>
              <tr><td style="height:10px; line-height:10px; font-size:0;">&nbsp;</td></tr>
              <tr>
                <td style="background-color:#161616; border-radius:12px; padding:16px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="40" valign="middle" align="center" style="width:40px; text-align:center; vertical-align:middle; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:16px; font-weight:900; font-style:italic; line-height:20px; color:#dfff5e;">04</td>
                    <td valign="middle" style="padding-left:6px; vertical-align:middle; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; line-height:20px; color:#F5F5F0;"><strong style="color:#F5F5F0;">Rejoins la communauté</strong><br><span style="color:#9A9A9A;">Amis, présence, messages. Entraîne-toi entouré.</span></td>
                  </tr></table>
                </td>
              </tr>
              <tr><td style="height:10px; line-height:10px; font-size:0;">&nbsp;</td></tr>
              <tr>
                <td style="background-color:#161616; border-radius:12px; padding:16px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="40" valign="middle" align="center" style="width:40px; text-align:center; vertical-align:middle; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:16px; font-weight:900; font-style:italic; line-height:20px; color:#dfff5e;">05</td>
                    <td valign="middle" style="padding-left:6px; vertical-align:middle; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; line-height:20px; color:#F5F5F0;"><strong style="color:#F5F5F0;">Participe à des défis</strong><br><span style="color:#9A9A9A;">D'autres challenges arrivent. Ne les rate pas.</span></td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td>
          <td class="om-stack om-mockup-col" valign="top" width="42%" height="1" align="center" style="width:42%; height:1px;">
            <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" style="height:100%;">
              <tr>
                <td align="center" valign="middle" height="100%" style="height:100%; padding:0; line-height:0; font-size:0;">
                  <img
                    src="${mockupSrc}"
                    alt="Capture One More : nouveau palier de ligue"
                    width="200"
                    class="om-mockup-img"
                    style="display:block; width:auto; max-width:100%; height:100%; max-height:100%; margin:0 auto; border-radius:16px; object-fit:contain;"
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- MAIN CTA -->
  <tr>
    <td class="om-px" align="center" style="padding:36px 32px 14px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" bgcolor="#dfff5e" style="border-radius:12px;">
            <a href="${downloadUrl}" target="_blank" style="display:block; padding:19px 24px; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:17px; font-weight:900; font-style:italic; letter-spacing:0.5px; color:#0A0A0A; text-decoration:none; text-transform:uppercase; border-radius:12px;">
              Télécharge One More →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:0 32px 8px 32px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:13px; color:#6E6E6E;">
      Gratuit. Disponible sur iOS et Android.<br>
      <a href="${downloadUrl}" style="color:#8A8A8A; text-decoration:underline;">App Store</a>
      &nbsp;·&nbsp;
      <a href="${downloadUrl}" style="color:#8A8A8A; text-decoration:underline;">Google Play</a>
    </td>
  </tr>

  <!-- SIGNATURE LINE -->
  <tr>
    <td class="om-px" align="center" style="padding:30px 32px 6px 32px; font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-size:15px; font-style:italic; font-weight:900; color:#F5F5F0; text-transform:uppercase; letter-spacing:0.5px;">
      Toujours une rep de plus.
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td style="padding:34px 32px 0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #262626; font-size:0; line-height:0;">&nbsp;</td></tr></table></td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td class="om-px" align="center" style="padding:24px 32px 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:11px; letter-spacing:2px; color:#5A5A5A; text-transform:uppercase; padding-bottom:10px;">ONE MORE</td>
        </tr>
        <tr>
          <td align="center" style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#5A5A5A;">
            Tu reçois cet email car tu as participé à l'événement.<br>
            <a href="${publicAppUrl}" style="color:#8A8A8A; text-decoration:none;">site.one-more.app</a>
            &nbsp;·&nbsp;
            <a href="https://instagram.com/one_more.app" style="color:#8A8A8A; text-decoration:none;">@one_more.app</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>

<!--[if mso]>
</td></tr></table>
<![endif]-->
</div>
</center>
</body>
</html>`;

  return { subject, html, text };
}
