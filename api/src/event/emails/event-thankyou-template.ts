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
  /** Absolute HTTPS or relative URL for @font-face (dry-run). Email clients often strip it. */
  fontFaceSrc?: string;
  /** Lien CTA téléchargement (OneLink AppsFlyer). */
  downloadUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  publicAppUrl: string;
};

export const EVENT_THANKYOU_SUBJECT =
  "Merci d'avoir participé · ton classement One More";

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
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
  if (params.highlight) {
    return `
              <tr>
                <td style="padding:10px 12px; background-color:#dfff5e; border-radius:10px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="42" style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:13px; font-weight:800; color:#0A0A0A;">#${params.rank}</td>
                      <td style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:14px; font-weight:700; color:#0A0A0A;">
                        ${name}${label ? ` <span style="font-weight:600; opacity:0.7;">${label}</span>` : ''}
                      </td>
                      <td align="right" style="font-family:'One More','Hanken Grotesk',Arial,sans-serif; font-style:italic; font-size:18px; font-weight:900; color:#0A0A0A; white-space:nowrap;">
                        ${params.reps} <span style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-style:normal; font-size:12px; font-weight:600;">reps</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
  }

  return `
              <tr>
                <td style="padding:8px 12px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="42" style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; color:#9A9A9A;">#${params.rank}</td>
                      <td style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:14px; font-weight:500; color:#D4D4D4;">
                        ${name}${label ? ` <span style="color:#9A9A9A;">${label}</span>` : ''}
                      </td>
                      <td align="right" style="font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; color:#9A9A9A; white-space:nowrap;">
                        ${params.reps} reps
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
                <td align="center" style="padding:2px 12px 6px 12px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:12px; color:#5A5A5A; letter-spacing:2px;">
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

      return `
  <tr>
    <td class="om-px" style="padding:0 32px ${paddingBottom} 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#161616; border-radius:14px;">
        <tr>
          <td style="padding:18px 18px 14px 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 4px 12px 4px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; color:#9A9A9A; text-transform:uppercase;">${escapeHtml(title)}</td>
                <td align="right" style="padding:0 4px 12px 4px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td bgcolor="#dfff5e" style="border-radius:100px; padding:4px 12px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:11px; font-weight:800; color:#0A0A0A;">#${row.rank}</td>
                  </tr></table>
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
  const appStoreUrl = escapeHtml(input.appStoreUrl);
  const playStoreUrl = escapeHtml(input.playStoreUrl);
  const publicAppUrl = escapeHtml(input.publicAppUrl.replace(/\/$/, ''));
  const downloadUrl = escapeHtml(input.downloadUrl.trim());
  const logoSrc = escapeHtml(input.logoSrc);
  const humanSrc = escapeHtml(input.humanSrc);
  const fontFaceSrc = input.fontFaceSrc?.trim();

  const fontFaceCss = fontFaceSrc
    ? `@font-face {
    font-family: 'One More';
    src: url('${escapeHtml(fontFaceSrc)}') format('opentype');
    font-weight: 100 900;
    font-style: normal;
  }`
    : `/* One More display font: host tbj-one-more.otf on HTTPS for clients that support @font-face. */`;

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
      ].filter(Boolean);
      return bits.join('\n  ');
    })
    .join('\n\n');

  const text = [
    `Bravo, ${firstNameRaw}.`,
    '',
    "Merci d'avoir participé à l'événement One More. Tu t'es présenté. Tu as poussé. Tu as fait une rep de plus.",
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
<title>${EVENT_THANKYOU_SUBJECT}</title>
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
  @media screen and (max-width: 600px) {
    .om-container { width: 100% !important; }
    .om-px { padding-left: 20px !important; padding-right: 20px !important; }
    .om-hero-title { font-size: 34px !important; line-height: 38px !important; }
    .om-stack { display: block !important; width: 100% !important; }
    .om-rank-cell { padding-bottom: 10px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0A0A0A; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#0A0A0A; opacity:0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif;">
${firstName}, ton bilan du challenge est prêt. Découvre ton classement et bats ton prochain record.
&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

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
        <tr>
          <td align="center" style="padding-top:16px; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:16px; line-height:24px; color:#9A9A9A;">
            Merci d'avoir participé. Tu t'es présenté. Tu as poussé. On a passé un super événement.
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

  <!-- BENEFITS LIST -->
  <tr>
    <td class="om-px" style="padding:0 32px 4px 32px;">
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
            <a href="${publicAppUrl}" style="color:#8A8A8A; text-decoration:none;">${publicAppUrl.replace(/^https?:\/\//, '')}</a>
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

  return { subject: EVENT_THANKYOU_SUBJECT, html, text };
}
