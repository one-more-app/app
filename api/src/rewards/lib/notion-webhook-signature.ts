import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyNotionWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  verificationToken: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expectedHex = signatureHeader.slice('sha256='.length);
  if (!/^[0-9a-f]+$/i.test(expectedHex)) return false;

  const hmac = createHmac('sha256', verificationToken);
  hmac.update(rawBody);
  const computedHex = hmac.digest('hex');

  try {
    const a = Buffer.from(computedHex, 'hex');
    const b = Buffer.from(expectedHex, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function signNotionWebhookPayload(
  rawBody: Buffer | string,
  verificationToken: string,
): string {
  const hmac = createHmac('sha256', verificationToken);
  hmac.update(rawBody);
  return `sha256=${hmac.digest('hex')}`;
}
