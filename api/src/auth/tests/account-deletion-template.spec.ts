import { describe, expect, it } from '@jest/globals';
import { renderAccountDeletionEmail } from '../emails/account-deletion-template.js';

describe('renderAccountDeletionEmail', () => {
  it('utilise le layout transactionnel clair', () => {
    const { subject, html, text } = renderAccountDeletionEmail({
      firstName: 'Vince',
      fontDataUri: '',
      replyMailto: 'mailto:admin@one-more.app?subject=Retour',
      supportEmail: 'admin@one-more.app',
    });

    expect(subject).toBe('Ton compte One More a été supprimé');
    expect(html).toContain('Compte');
    expect(html).toContain('Suppression confirmée');
    expect(html).toContain('Salut Vince,');
    expect(html).toContain('Répondre');
    expect(html).toContain('mailto:admin@one-more.app');
    expect(html).toContain('Ou écris à admin@one-more.app');
    expect(html).toContain('ALWAYS ONE MORE');
    expect(html).toContain('© 2026 ZILTON. Tous droits réservés.');
    expect(html).toContain('c0534ae2-e030-40d4-92fc-086df7fdf369');
    expect(html).toContain('bgcolor="#0A0A0A"');
    expect(html).toContain('#dfff5e');
    expect(html).toContain('#F3F3F3');
    expect(html).not.toContain('Se désinscrire');
    expect(text).toContain('supprimé');
    expect(text).toContain('Répondre');
  });
});
