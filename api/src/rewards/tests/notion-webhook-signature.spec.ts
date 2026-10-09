import {
  signNotionWebhookPayload,
  verifyNotionWebhookSignature,
} from '../lib/notion-webhook-signature.js';

describe('notion-webhook-signature', () => {
  const token = 'secret_test_verification_token';
  const body = Buffer.from('{"type":"page.properties_updated"}');

  it('verifies a valid signature', () => {
    const signature = signNotionWebhookPayload(body, token);
    expect(verifyNotionWebhookSignature(body, signature, token)).toBe(true);
  });

  it('rejects tampered body', () => {
    const signature = signNotionWebhookPayload(body, token);
    const tampered = Buffer.from('{"type":"page.created"}');
    expect(verifyNotionWebhookSignature(tampered, signature, token)).toBe(
      false,
    );
  });

  it('rejects missing or malformed header', () => {
    expect(verifyNotionWebhookSignature(body, undefined, token)).toBe(false);
    expect(verifyNotionWebhookSignature(body, 'sha256=zz', token)).toBe(false);
  });
});
