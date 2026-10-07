# Setup AWS SES · emails outbound One More

Runbook ops : ce qu’il faut créer dans AWS, quels secrets coller sur l’API, et comment le tracking OpenPanel est branché.  
Contrat n8n : [`outbound-n8n-reference.md`](./outbound-n8n-reference.md). Spec : [`superpowers/specs/2026-10-06-outbound-marketing-design.md`](./superpowers/specs/2026-10-06-outbound-marketing-design.md).

Sans SES, l’API envoie quand même via **SMTP** (`SMTP_*`). Dans ce cas : **pas** d’opens, **pas** de clics, **pas** de bounces SNS. OpenPanel ne verra que `email_sent`.

---

## Ce que le code fait vraiment

```text
n8n  →  POST /internal/outbound/dispatch|send
API   →  file outbound_messages (pending)
cron  →  SES SendEmail (v2) + tags + Configuration Set
SES   →  pixel / wrap des liens (engagement tracking)
SNS   →  POST https://<PUBLIC_API_URL>/webhooks/ses
API   →  suppressions (bounce/complaint) + OpenPanel (open/click)
```

Fichiers :

| Rôle | Fichier |
|------|---------|
| Choix SES vs SMTP | `api/src/outbound/providers/outbound-mailer.service.ts` |
| Envoi SES v2 | `api/src/outbound/providers/ses-mailer.service.ts` |
| Quota | `SES_MAX_SEND_PER_SECOND` (défaut **14**) dans le worker |
| Webhook SNS | `api/src/outbound/feedback/ses-webhook.controller.ts` |
| Signature SNS | `sns-validator` (certificats Amazon, `rawBody: true` dans `main.ts`) |
| OpenPanel serveur | `api/src/analytics/analytics.service.ts` (`profileId` = `userId`) |

SES s’active seulement si **les 4** sont non vides : `AWS_SES_REGION`, `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `SES_FROM_ADDRESS`. Sinon : SMTP, puis échec « Aucun transport email ».

---

## 1. Identité de domaine (SES)

Région recommandée : **`eu-west-3`** (Paris), alignée sur `api/.env.example`. Le topic SNS, le Configuration Set et les clés IAM doivent être **dans la même région**.

1. Console AWS → **Amazon SES** → **Identities** → **Create identity** → Domain.
2. Domaine d’envoi : `one-more.app` (ou un sous-domaine dédié `mail.one-more.app` / `news.one-more.app` : meilleure pratique, isole le marketing du site).
3. Activer **DKIM** (Easy DKIM, 2048 bits). Copier les 3 CNAME chez le registrar.
4. (Recommandé) **Custom MAIL FROM** : `bounce.one-more.app` (ou `bounce.mail.one-more.app`) + MX / SPF indiqués par SES. Ça évite `amazonses.com` en Return-Path.
5. Attendre **Verified**. Tester un envoi sandbox vers une adresse vérifiée avant de demander la sortie sandbox.

**SPF / DMARC** (registrar) :

```text
TXT  @     "v=spf1 include:amazonses.com ~all"
TXT  _dmarc  "v=DMARC1; p=quarantine; rua=mailto:admin@one-more.app"
```

Ajuster si un SPF existe déjà (`include:amazonses.com` dans le même TXT, un seul SPF par domaine).

**From** que l’API enverra : une adresse **sur ce domaine**, ex. `One More <noreply@one-more.app>`.

### Sandbox

Compte SES neuf = sandbox : tu n’envoies qu’à des emails **vérifiés**. Pour staging/prod réels : **Account dashboard → Request production access**. Motif type : app fitness, opt-out dans chaque mail, volume faible au départ (quelques k/mois).

---

## 2. IAM (clés API)

Ne **pas** coller la root key. Créer un user IAM (ou un rôle si un jour l’API tourne sur ECS/IRSA).

Policy minimale (identité déjà vérifiée) :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

Restreindre `Resource` à l’ARN de l’identité dès que c’est stable :

`arn:aws:ses:eu-west-3:<ACCOUNT_ID>:identity/one-more.app`

Créer une **access key** → `AWS_SES_ACCESS_KEY_ID` / `AWS_SES_SECRET_ACCESS_KEY`. Une paire **par environnement** (staging ≠ prod).

---

## 3. Configuration Set (tracking)

Sans Configuration Set, SES envoie le mail mais **n’émet pas** Open / Click / Bounce vers SNS → OpenPanel n’aura que `email_sent`.

1. SES → **Configuration sets** → Create. Nom : `one-more-marketing` (staging : `one-more-marketing-staging`).
2. Onglet **Reputation options** : activer le tracking de réputation.
3. **Event destinations** → Add destination :
   - Event types à cocher : **Send**, **Reject**, **Bounce**, **Complaint**, **Delivery**, **Open**, **Click**.  
     Le code n’agit que sur **Bounce** (Permanent), **Complaint**, **Open**, **Click**. Les autres sont utiles en debug CloudWatch / SNS.
   - Destination : **Amazon SNS** (étape 4).
4. Engagement tracking : **Open et Click activés** (pixel + réécriture des liens). C’est **ça** qui alimente OpenPanel, pas un SDK dans le HTML. Sans ça, SNS peut recevoir Bounce/Complaint mais jamais Open/Click.
5. (Optionnel, prod) **Custom tracking domain** : un CNAME type `track.one-more.app` à la place de `*.awstrack.me`. Moins de filtres anti-phishing, même pixel SES.

Nom exact du set → `SES_CONFIGURATION_SET`.

---

## 4. Topic SNS + webhook API

1. SNS (même région) → **Topics** → Standard (pas FIFO) → nom `one-more-ses-events` (staging : `…-staging`).
2. **Pas** de « raw message delivery » : l’API attend l’enveloppe SNS (`Type`, `Signature`, `Message` JSON).
3. Subscription :
   - Protocol : **HTTPS**
   - Endpoint :
     - staging : `https://api.staging.one-more.app/webhooks/ses`
     - prod : `https://api.one-more.app/webhooks/ses`
4. Au premier POST, SNS envoie `SubscriptionConfirmation`. L’API fait `fetch(SubscribeURL)` toute seule (pas de clic console), **à condition que l’API soit déjà déployée** avec ce webhook. Sinon : renvoyer la sub, ou confirmer à la main dans SNS.
5. Copier l’ARN du topic → `SES_SNS_TOPIC_ARN`. Si la variable est définie, un autre topic = `401 Topic SNS inattendu`.

Le body brut est requis (`rawBody: true`) pour valider la signature. Un reverse-proxy qui reparse le JSON casse la vérif.

---

## 5. Secrets à coller (Dokploy / `.env`)

| Variable | Obligatoire | Exemple / rôle |
|----------|-------------|----------------|
| `AWS_SES_REGION` | oui (pour SES) | `eu-west-3` |
| `AWS_SES_ACCESS_KEY_ID` | oui | IAM ci-dessus |
| `AWS_SES_SECRET_ACCESS_KEY` | oui | jamais dans git |
| `SES_FROM_ADDRESS` | oui | `One More <noreply@one-more.app>` |
| `SES_CONFIGURATION_SET` | fortement | `one-more-marketing` |
| `SES_SNS_TOPIC_ARN` | fortement | `arn:aws:sns:eu-west-3:…:one-more-ses-events` |
| `SES_MAX_SEND_PER_SECOND` | non | `14` (reste sous le quota SES, souvent 14 sandbox / ~14–50 début prod) |
| `SES_UNSUBSCRIBE_MAILTO` | non | `mailto:admin@one-more.app` (en-tête List-Unsubscribe, mails **marketing**) |
| `PUBLIC_API_URL` | oui pour les liens `/u/:token` | `https://api.one-more.app` (sans slash final) |
| `OUTBOUND_API_KEY` | oui n8n | header `X-Outbound-Api-Key` |
| `OPENPANEL_CLIENT_ID` | oui tracking serveur | **même projet** que le client si tu veux joindre les profils |
| `OPENPANEL_CLIENT_SECRET` | oui tracking serveur | secret serveur OpenPanel (pas le client Vite) |
| `OPENPANEL_API_URL` | non | `https://api.openpanel.dev` ou self-host `https://track.dokploy.one-more.app/api` |

Staging : tout préfixer / séparer (domaine SES de test **ou** même domaine + Configuration Set / topic / clés **dédiés**). Ne pas pointer le SNS prod vers l’API staging.

SMTP de secours (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) : utile en local. Dès que les 4 vars SES sont là, **SES gagne**.

---

## 6. OpenPanel : comment c’est géré

Pas de pixel maison. SES fait le tracking d’engagement ; l’API **traduit** vers OpenPanel.

### `email_sent`

Émis par le **worker** juste après un `MessageId` SES (ou SMTP) OK.

- `profileId` = UUID utilisateur One More (même id que le tracking client si `identify` a déjà tourné).
- Props : `template_key`, `channel: "email"`.

Sans `OPENPANEL_CLIENT_ID` + `OPENPANEL_CLIENT_SECRET` côté API : l’envoi mail marche, **aucun** event serveur.

### `email_opened` / `email_clicked`

Émis par **`POST /webhooks/ses`** quand SES publie `eventType` `Open` ou `Click`.

1. SES attache les **EmailTags** posés à l’envoi : `userId`, `templateKey`, `outboundMessageId`, `campaignKey` (id du dispatch ou `single`).
2. L’event SNS contient `mail.tags`. SES **minuscule** les clés (`userid`, `templatekey`, …) : l’API les relit sans tenir compte de la casse.
3. L’API met à jour `outbound_messages.openedAt` / `clickedAt`.
4. Puis `analytics.track(userId, 'email_opened'|'email_clicked', { template_key })`.

Si `userId` est absent des tags (mail hors worker, ou Configuration Set sans tags) : bounce/complaint sont quand même traités via l’adresse ; **pas** d’event OpenPanel.

### Ce qui n’est **pas** dans OpenPanel

| Signal SES | Traitement |
|------------|------------|
| Bounce `Permanent` | Ligne `email_suppressions` (`bounce_hard`) → plus d’email marketing |
| Bounce transitoire | Ignoré (pas de suppression) |
| Complaint (spam) | `email_suppressions` (`complaint`) |
| Delivery / Send / Reject | Ignorés par le code (visibles dans SNS / CloudWatch) |

Dashboards utiles : filtre `email_sent` / `email_opened` / `email_clicked` + breakdown `template_key`. Taux d’ouverture ≈ `email_opened` / `email_sent` (Apple Mail Privacy relèvera des faux opens : normal).

---

## 7. Désinscription (lié à SES)

Sur les mails **`category: marketing`** seulement :

- En-têtes `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058) : URL `https://<PUBLIC_API_URL>/u/<token>` + `SES_UNSUBSCRIBE_MAILTO`.
- Footer HTML : Se désinscrire + Gérer mes préférences (`https://one-more.app/#/settings`).

Le mail CGU (`cgu_update_emails_notice`) est **transactionnel** : pas ces en-têtes, pas de filtre `marketingEmail`.

---

## 8. Checklist de vérif

1. Identité SES **Verified**, DKIM `Success`, hors sandbox (prod) ou destinataire vérifié (sandbox).
2. API déployée avec les 4 vars SES + `SES_CONFIGURATION_SET` + `SES_SNS_TOPIC_ARN` + OpenPanel serveur.
3. SNS : subscription **Confirmed** sur `/webhooks/ses`.
4. Envoi test (catalogue + `POST /internal/outbound/send` vers **ton** user) :
   - ligne `outbound_messages` `status=sent`, `providerMessageId` rempli ;
   - OpenPanel : `email_sent` ;
   - ouvrir le mail (client qui charge les images) → `openedAt` + `email_opened` ;
   - cliquer le CTA → `clickedAt` + `email_clicked`.
5. Bounce volontaire (adresse `bounce@simulator.amazonses.com` en sandbox) → row dans `email_suppressions`.
6. Logs API : pas de `Signature SNS invalide` (souvent raw body / HTTPS terminator).

SMTP seul : étape 4 s’arrête à `email_sent`, pas d’open/click.

---

## 9. Bonnes pratiques (courtes)

- Sous-domaine d’envoi dédié ; ne pas brûler `@one-more.app` transactionnel et marketing sur la même réputation si le volume explose.
- Un Configuration Set **et** un topic **par env**.
- Rester **sous** le quota SES (`SES_MAX_SEND_PER_SECOND=14` est volontairement prudent).
- Warm-up : ne pas passer de 0 à toute la base le premier jour prod. Staging d’abord, puis CGU, puis winback.
- Ne jamais committer les access keys. Rotation IAM = nouvelles vars, redéploiement API.
- Surveiller le **bounce rate** SES (console Reputation). Au-dessus de ~5 % AWS peut pause le compte ; les hard bounces sont déjà supprimés en base.

---

## 10. Pannes fréquentes

| Symptôme | Cause probable |
|----------|----------------|
| `SES non configuré` / envoi SMTP | Une des 4 vars SES vide |
| Mail parti, zéro open/click | Configuration Set manquant, ou Open/Click off, ou SMTP |
| `Signature SNS invalide` | Body re-sérialisé, HTTP au lieu de HTTPS, raw message delivery ON |
| `Topic SNS inattendu` | ARN staging vs prod |
| Subscription SNS `Pending` | API down au moment du subscribe |
| OpenPanel vide, mail OK | `OPENPANEL_CLIENT_SECRET` absent côté **API** (le `VITE_*` client ne sert pas ici) |
| 401 n8n | `OUTBOUND_API_KEY` ≠ header n8n (`TO_CHANGE` encore dans [Sub] Appel API) |
