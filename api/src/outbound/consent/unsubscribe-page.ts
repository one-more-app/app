import { escapeHtml } from '../../emails/transactional-layout.js';

export function renderUnsubscribePage(params: {
  alreadyUnsubscribed: boolean;
  token: string;
  preferencesUrl: string;
}): string {
  const title = params.alreadyUnsubscribed
    ? 'Désinscription confirmée'
    : 'Se désinscrire des emails';
  const message = params.alreadyUnsubscribed
    ? 'Tu ne recevras plus d’emails marketing de One More.'
    : 'Tu ne recevras plus d’emails marketing One More (récaps, conseils, nouveautés). Les emails essentiels liés à ton compte peuvent encore t’être envoyés.';
  const prefs = escapeHtml(params.preferencesUrl);

  const formBlock = params.alreadyUnsubscribed
    ? ''
    : `<form method="post" action="/u/${escapeHtml(params.token)}" style="margin:24px 0 0 0;">
  <button type="submit" style="display:block;width:100%;padding:16px 24px;border:none;border-radius:12px;background:#0A0A0A;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;cursor:pointer;">
    Confirmer la désinscription
  </button>
</form>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — One More</title>
  <style>
    body { margin:0; padding:32px 16px; background:#F3F3F3; font-family:Arial,Helvetica,sans-serif; color:#0A0A0A; }
    .card { max-width:480px; margin:0 auto; background:#fff; border-radius:16px; padding:28px; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
    h1 { margin:0 0 12px 0; font-size:22px; }
    p { margin:0 0 12px 0; line-height:1.55; color:#3A3A3A; font-size:15px; }
    a { color:#3A3A3A; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${formBlock}
    <p style="margin-top:24px;font-size:13px;color:#8A8A8A;">
      Tu peux aussi gérer tes préférences dans l’app :
      <a href="${prefs}">Réglages notifications</a>
    </p>
  </div>
</body>
</html>`;
}

export function renderUnsubscribeDonePage(preferencesUrl: string): string {
  const prefs = escapeHtml(preferencesUrl);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Désinscription confirmée — One More</title>
  <style>
    body { margin:0; padding:32px 16px; background:#F3F3F3; font-family:Arial,Helvetica,sans-serif; color:#0A0A0A; }
    .card { max-width:480px; margin:0 auto; background:#fff; border-radius:16px; padding:28px; }
    h1 { margin:0 0 12px 0; font-size:22px; }
    p { line-height:1.55; color:#3A3A3A; font-size:15px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>C’est noté</h1>
    <p>Tu es désinscrit des emails marketing One More.</p>
    <p><a href="${prefs}">Gérer mes préférences</a></p>
  </div>
</body>
</html>`;
}
