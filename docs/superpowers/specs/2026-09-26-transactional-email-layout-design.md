# Layout email transactionnel réutilisable

Date : 2026-09-26  
Statut : validé (design)

## Problème

Le mail de confirmation de suppression de compte utilise aujourd’hui un HTML sombre ad hoc, proche du thank-you événement. Un mockup transactionnel clair (carte blanche, accent lime, CTA noir) définit le look produit pour les mails système. On veut :

1. Un layout HTML partagé fidèle à ce mockup.
2. Brancher le mail de suppression dessus.
3. Pouvoir réutiliser le même layout pour d’autres mails sans dupliquer le HTML.

## Décisions

| Sujet | Choix |
|---|---|
| Approche | Layout partagé TypeScript (`renderTransactionalEmail`) — tables + styles inline, comme les mails existants |
| Premier consommateur | Mail suppression de compte uniquement |
| Pilule info (`label` / `value`) | Slot optionnel ; **omis** pour la suppression |
| Liens footer (Aide / Se désinscrire) | Slot optionnel ; **omis** pour la suppression |
| Stack | Pas de MJML ; nodemailer + CID logo + font data-URI inchangés |
| Thank-you événement | Hors scope (reste sur son template custom) |

## Design visuel (layout)

- Fond page : gris clair (`#F3F3F3` ou équivalent proche du mockup).
- Logo marque (mark « Z » / lightning) centré **au-dessus** de la carte, version sombre adaptée au fond clair.
- Carte blanche, coins arrondis, barre accent lime (`#dfff5e`) en haut à gauche.
- Typo : Hanken Grotesk (corps) + police One More (titres / slogan italic).
- Footer hors carte : « ALWAYS ONE MORE », disclaimer auto-reply, « One More SAS - Paris, France », puis liens optionnels.

## API du layout

Fichier : `api/src/emails/transactional-layout.ts`

```ts
type TransactionalEmailInput = {
  subject: string
  preheader: string
  logoSrc: string
  fontDataUri: string
  eyebrow: string
  title: string
  firstName: string
  /** HTML déjà échappé / contrôlé (paragraphes). */
  bodyHtml: string
  /** Texte brut pour la partie body (variante text/plain). */
  bodyText: string
  info?: { label: string; value: string }
  cta?: { label: string; href: string }
  secondaryText?: string
  footerLinks?: Array<{ label: string; href: string }>
}
```

Comportement :

- `escapeHtml` centralisé dans le layout pour les champs string.
- Sections absentes (`info`, `cta`, `secondaryText`, `footerLinks`) → HTML non rendu.
- Retourne `{ subject, html, text }`.
- Helpers partagés : preheader (filler invisible), `@font-face` One More.

## Mapping mail suppression

| Slot | Valeur |
|---|---|
| Eyebrow | `Compte` |
| Title | `Suppression confirmée` |
| Salutation | `Salut {{firstName}},` |
| Body | Confirmation de suppression + données inaccessibles (équivalent du copy actuel, ton clair) |
| Info | omis |
| CTA | `Répondre` → `mailto:` support (sujet feedback) |
| Secondary | `Ou écris à admin@one-more.app` |
| Footer links | omis |
| Subject | `Ton compte One More a été supprimé` (inchangé) |
| Preheader | inchangé (invite feedback courte) |

Fichier : `api/src/auth/emails/account-deletion-template.ts` devient un thin wrapper qui compose le contenu et appelle `renderTransactionalEmail`.

## Intégration service

`AccountDeletionMailService` :

- Même SMTP / nodemailer / `replyTo` support.
- CID logo : utiliser la mark noire (`client/src/assets/logo-black.png`, déjà utilisée dans l’app). Copier l’asset côté API sous `api/src/emails/assets/` (ou chemin partagé) pour l’attachement CID — le `logo-white-text.png` actuel ne convient pas au fond clair.
- Font woff2 data-URI : inchangé.

## Hors scope

- Migration du thank-you événement.
- MJML / React Email.
- Nouveaux types de mails (welcome, reset password, etc.) — seuls les slots sont prévus.
- Page Aide / flux désinscription (liens non branchés tant que non fournis).

## Critères de succès

- Rendu HTML proche du mockup transactionnel (carte, accent, CTA, footer).
- Mail suppression envoyé via le layout partagé.
- Un second mail futur peut appeler `renderTransactionalEmail` sans copier le HTML de structure.
- Variante `text/plain` toujours générée.
