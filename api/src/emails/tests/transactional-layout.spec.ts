import { describe, expect, it } from '@jest/globals';
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
    expect(html).not.toContain('cta_marker');
    expect(html).not.toContain('>Aide<');
    expect(html).not.toContain('Se désinscrire');
    expect(html).not.toContain('border-radius:999px');
  });

  it('rend info, cta, secondary et footer links quand fournis', () => {
    const { html, text } = renderTransactionalEmail({
      ...base,
      info: { label: 'Compte', value: 'v@x.com' },
      cta: { label: 'Répondre', href: 'mailto:admin@one-more.app' },
      secondaryText: 'Ou écris à admin@one-more.app',
      footerLinks: [
        { label: 'Aide', href: 'https://site.one-more.app' },
        {
          label: 'Se désinscrire',
          href: 'https://site.one-more.app/unsub',
        },
      ],
    });
    expect(html).toContain('v@x.com');
    expect(html).toContain('Répondre');
    expect(html).toContain('mailto:admin@one-more.app');
    expect(html).toContain('Ou écris à admin@one-more.app');
    expect(html).toContain('Aide');
    expect(html).toContain('Se désinscrire');
    expect(html).toContain('border-radius:999px');
    expect(text).toContain('Répondre');
  });
});
