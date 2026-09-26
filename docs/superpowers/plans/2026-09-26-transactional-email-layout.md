# Transactional Email Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layout email transactionnel HTML partagé (mockup carte claire) et branchement du mail de suppression de compte dessus.

**Architecture:** `renderTransactionalEmail` dans `api/src/emails/transactional-layout.ts` génère le HTML/text commun. `account-deletion-template.ts` ne fournit que le contenu métier. Le service mail bascule le CID vers `logo-black.png`.

**Tech Stack:** TypeScript NestJS, HTML email tables + inline CSS, nodemailer CID, Jest.

## Global Constraints

- Fidèle au mockup : fond gris clair, logo mark noir au-dessus, carte blanche, barre lime `#dfff5e`, CTA noir, footer « ALWAYS ONE MORE ».
- Slots optionnels : `info`, `cta`, `secondaryText`, `footerLinks` (omis si absents).
- Suppression : pas d’info, pas de liens footer ; CTA Répondre mailto ; secondary support.
- Pas de MJML ; thank-you événement hors scope.
- Paths relatifs au repo `app/`.

## File Structure

| File | Responsibility |
|---|---|
| `api/src/emails/transactional-layout.ts` | Layout HTML/text partagé + helpers escape/preheader/font |
| `api/src/emails/assets/logo-black.png` | Mark noire pour fond clair (copie depuis client) |
| `api/src/emails/tests/transactional-layout.spec.ts` | Tests structure HTML / slots optionnels |
| `api/src/auth/emails/account-deletion-template.ts` | Contenu suppression → appel layout |
| `api/src/auth/account-deletion-mail.service.ts` | CID → logo-black |

---

### Task 1: Layout transactionnel + tests

**Files:**
- Create: `api/src/emails/transactional-layout.ts`
- Create: `api/src/emails/assets/logo-black.png` (copie de `client/src/assets/logo-black.png`)
- Create: `api/src/emails/tests/transactional-layout.spec.ts`

**Interfaces:**
- Produces: `renderTransactionalEmail(input: TransactionalEmailInput): { subject; html; text }`
- Type `TransactionalEmailInput` : `subject`, `preheader`, `logoSrc`, `fontDataUri`, `eyebrow`, `title`, `firstName`, `bodyHtml`, `bodyText`, `info?`, `cta?`, `secondaryText?`, `footerLinks?`

- [ ] **Step 1: Copier le logo noir**

```bash
mkdir -p api/src/emails/assets api/src/emails/tests
cp client/src/assets/logo-black.png api/src/emails/assets/logo-black.png
```

- [ ] **Step 2: Écrire le test qui échoue**

```ts
import { renderTransactionalEmail } from '../transactional-layout.js';

describe('renderTransactionalEmail', () => {
  const base = {
    subject: 'Sujet test',
    preheader: 'Preheader test',
    logoSrc: 'cid:logo',
    fontDataUri: '',
    eyebrow: 'Compte',
    title: 'Suppression confirmée',
    firstName: 'Vince',
    bodyHtml: '<p>Corps</p>',
    bodyText: 'Corps',
  };

  it('inclut eyebrow, title, salutation et footer brand', () => {
    const { html, text, subject } = renderTransactionalEmail(base);
    expect(subject).toBe('Sujet test');
    expect(html).toContain('Compte');
    expect(html).toContain('Suppression confirmée');
    expect(html).toContain('Salut Vince,');
    expect(html).toContain('ALWAYS ONE MORE');
    expect(html).toContain('#dfff5e');
    expect(text).toContain('Vince');
    expect(text).toContain('Corps');
  });

  it('omet info, cta, secondary et footer links si absents', () => {
    const { html } = renderTransactionalEmail(base);
    expect(html).not.toContain('info_label_marker');
    expect(html).not.toContain('cta_marker');
    expect(html).not.toContain('Aide');
    expect(html).not.toContain('Se désinscrire');
  });

  it('rend info, cta, secondary et footer links quand fournis', () => {
    const { html, text } = renderTransactionalEmail({
      ...base,
      info: { label: 'Compte', value: 'v@x.com' },
      cta: { label: 'Répondre', href: 'mailto:admin@one-more.app' },
      secondaryText: 'Ou écris à admin@one-more.app',
      footerLinks: [
        { label: 'Aide', href: 'https://site.one-more.app' },
        { label: 'Se désinscrire', href: 'https://site.one-more.app/unsub' },
      ],
    });
    expect(html).toContain('Compte');
    expect(html).toContain('v@x.com');
    expect(html).toContain('Répondre');
    expect(html).toContain('mailto:admin@one-more.app');
    expect(html).toContain('Ou écris à admin@one-more.app');
    expect(html).toContain('Aide');
    expect(html).toContain('Se désinscrire');
    expect(text).toContain('Répondre');
  });
});
```

- [ ] **Step 3: Run test — doit échouer**

Run: `cd api && npx jest src/emails/tests/transactional-layout.spec.ts --no-cache 2>&1 | tail -30`  
Expected: FAIL (module introuvable ou fonction absente)

- [ ] **Step 4: Implémenter `transactional-layout.ts`**

Implémenter fidèle au mockup :
- Fond `#F3F3F3`, carte blanche `border-radius:16px`, barre lime 28×4 en haut à gauche
- Logo 40px centré au-dessus
- Eyebrow 12px gris, title italic One More ~28px noir
- « Salut {firstName}, » + `bodyHtml`
- Info pill `#F0F0F0` border-radius 999 si `info`
- CTA bouton noir full-width-ish border-radius 12, label blanc italic uppercase si `cta`
- Separator + `secondaryText` gris si présent
- Footer : ALWAYS ONE MORE (One More font), disclaimer FR, One More SAS - Paris, France, liens joints par ` · ` si `footerLinks`
- `text` : lignes plain (eyebrow, title, salut, bodyText, info, cta url, secondary, slogan)
- escapeHtml sur tous les champs string utilisateur ; `bodyHtml` fourni déjà sûr par l’appelant
- Reprendre helpers font-face / preheader du template suppression actuel

- [ ] **Step 5: Run tests — doivent passer**

Run: `cd api && npx jest src/emails/tests/transactional-layout.spec.ts --no-cache`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/emails/
git commit -m "feat(api): add reusable transactional email layout"
```

---

### Task 2: Brancher le mail suppression

**Files:**
- Modify: `api/src/auth/emails/account-deletion-template.ts`
- Modify: `api/src/auth/account-deletion-mail.service.ts`

**Interfaces:**
- Consumes: `renderTransactionalEmail` de Task 1
- Produces: `renderAccountDeletionEmail` / `buildAccountDeletionSubject` inchangés côté signature publique (même input type adapté si besoin)

- [ ] **Step 1: Réécrire `account-deletion-template.ts` comme wrapper**

```ts
export function renderAccountDeletionEmail(input: AccountDeletionTemplateInput) {
  const firstName = input.firstName.trim() || 'athlète';
  const bodyText = [
    'Ton compte One More a bien été supprimé, comme demandé.',
    'Tes données associées ne sont plus accessibles via ce compte.',
    '',
    'On aimerait comprendre ce qui n’a pas fonctionné pour toi.',
    'Réponds simplement à cet email et dis-nous ce qui ne te convenait pas — ça nous aide vraiment à améliorer One More.',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 12px 0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; font-weight:500; line-height:1.55; color:#3A3A3A;">
      Ton compte One More a bien été <strong style="color:#0A0A0A;">supprimé</strong>, comme demandé.
    </p>
    <p style="margin:0 0 12px 0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; font-weight:500; line-height:1.55; color:#3A3A3A;">
      Tes données associées ne sont plus accessibles via ce compte.
    </p>
    <p style="margin:0; font-family:'Hanken Grotesk',Arial,Helvetica,sans-serif; font-size:15px; font-weight:500; line-height:1.55; color:#3A3A3A;">
      On aimerait comprendre ce qui n’a pas fonctionné pour toi. Réponds à cet email — même en deux lignes — pour nous aider à faire mieux.
    </p>`;

  return renderTransactionalEmail({
    subject: buildAccountDeletionSubject(),
    preheader: 'Confirmation de suppression — dis-nous ce qui n’allait pas si tu as 30 secondes.',
    logoSrc: input.logoSrc,
    fontDataUri: input.fontDataUri,
    eyebrow: 'Compte',
    title: 'Suppression confirmée',
    firstName,
    bodyHtml,
    bodyText,
    cta: { label: 'Répondre', href: input.replyMailto },
    secondaryText: `Ou écris à ${input.supportEmail.trim()}`,
  });
}
```

Retirer le gros HTML sombre inline. Garder le type `AccountDeletionTemplateInput`.

- [ ] **Step 2: Pointer le service vers `logo-black.png`**

Dans `account-deletion-mail.service.ts` :
- `LOGO_PATH` → `../emails/assets/logo-black.png` (depuis `auth/`)
- `FONT_WOFF2_PATH` peut rester sur `event/emails/fonts/...` ou pointer vers le même fichier
- attachment filename `logo-black.png`, cid inchangé `one-more-logo`

- [ ] **Step 3: Vérifier build + tests auth existants**

Run:
```bash
cd api && npx jest src/emails/tests/transactional-layout.spec.ts src/auth/tests/auth-delete-account.service.spec.ts --no-cache
cd api && npm run build
```
Expected: PASS / build OK

- [ ] **Step 4: Commit**

```bash
git add api/src/auth/emails/account-deletion-template.ts api/src/auth/account-deletion-mail.service.ts
git commit -m "feat(api): use transactional layout for account deletion email"
```
