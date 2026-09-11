import { describe, expect, it } from '@jest/globals';
import {
  buildRedditSignUpPayload,
  canonicalizeEmail,
  clientIpFromHeaders,
  extractRedditAdsContext,
  hashEmailForReddit,
  isPlaceholderAdvertisingId,
  redditActionSourceFromOrigin,
} from '../reddit-conversions.js';

describe('canonicalizeEmail / hashEmailForReddit', () => {
  it('canonicalizes like Reddit (lowercase, strip dots and plus aliases)', () => {
    expect(canonicalizeEmail('Al.ice+Apple@Example.Com')).toBe(
      'alice@example.com',
    );
  });

  it('hashes the official Reddit SignUp example', () => {
    expect(hashEmailForReddit('Al.ice+Apple@Example.Com')).toBe(
      'ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976',
    );
  });

  it('returns null for empty or invalid emails', () => {
    expect(canonicalizeEmail('')).toBeNull();
    expect(canonicalizeEmail('not-an-email')).toBeNull();
    expect(hashEmailForReddit('')).toBeNull();
  });
});

describe('clientIpFromHeaders', () => {
  it('prefers the first public X-Forwarded-For hop', () => {
    expect(
      clientIpFromHeaders(
        { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
        '10.0.0.1',
      ),
    ).toBe('203.0.113.10');
  });

  it('skips loopback addresses', () => {
    expect(
      clientIpFromHeaders({ 'x-forwarded-for': '127.0.0.1' }, '::1'),
    ).toBeUndefined();
  });

  it('unwraps IPv4-mapped IPv6', () => {
    expect(
      clientIpFromHeaders({ 'x-real-ip': '::ffff:203.0.113.20' }),
    ).toBe('203.0.113.20');
  });
});

describe('redditActionSourceFromOrigin', () => {
  it('treats Capacitor / native origins as APP', () => {
    expect(redditActionSourceFromOrigin('capacitor://localhost')).toBe('APP');
    expect(redditActionSourceFromOrigin('ionic://localhost')).toBe('APP');
    expect(redditActionSourceFromOrigin('one-more://localhost')).toBe('APP');
  });

  it('treats public https origins as WEBSITE', () => {
    expect(redditActionSourceFromOrigin('https://one-more.app')).toBe(
      'WEBSITE',
    );
  });

  it('defaults to APP when origin is missing', () => {
    expect(redditActionSourceFromOrigin(undefined)).toBe('APP');
  });
});

describe('isPlaceholderAdvertisingId', () => {
  it('rejects all-zero MAIDs', () => {
    expect(
      isPlaceholderAdvertisingId('00000000-0000-0000-0000-000000000000'),
    ).toBe(true);
    expect(
      isPlaceholderAdvertisingId('EA7583CD-A667-48BC-B806-42ECB2B48606'),
    ).toBe(false);
  });
});

describe('buildRedditSignUpPayload', () => {
  it('builds a SIGN_UP event with conversion_id, hashed email and no fake value', () => {
    const payload = buildRedditSignUpPayload({
      userId: 'user-123',
      email: 'Al.ice+Apple@Example.Com',
      ipAddress: '203.0.113.10',
      userAgent: 'OneMore/1.0',
      clickId: 'rdt_click_abc',
      actionSource: 'APP',
      eventAtMs: 1_735_707_600_000,
    });

    expect(payload).toEqual({
      data: {
        events: [
          {
            event_at: 1_735_707_600_000,
            action_source: 'APP',
            type: { tracking_type: 'SIGN_UP' },
            click_id: 'rdt_click_abc',
            user: {
              email:
                'ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976',
              ip_address: '203.0.113.10',
              user_agent: 'OneMore/1.0',
              external_id: 'user-123',
            },
            metadata: { conversion_id: 'signup:user-123' },
          },
        ],
      },
    });
    expect(JSON.stringify(payload)).not.toContain('value');
    expect(JSON.stringify(payload)).not.toContain('alice@example.com');
  });

  it('omits Apple Hide My Email from hashing surprises by still hashing the relay address', () => {
    const payload = buildRedditSignUpPayload({
      userId: 'user-apple',
      email: 'abc@privaterelay.appleid.com',
      actionSource: 'APP',
      eventAtMs: 1,
    });
    const event = payload.data.events[0];
    expect(event.user.email).toMatch(/^[a-f0-9]{64}$/);
    expect(event.metadata.conversion_id).toBe('signup:user-apple');
  });

  it('still sends when email is missing (OAuth Apple without email) if other match keys exist', () => {
    const payload = buildRedditSignUpPayload({
      userId: 'user-no-email',
      email: null,
      ipAddress: '203.0.113.10',
      actionSource: 'APP',
      eventAtMs: 1,
    });
    expect(payload.data.events[0].user.email).toBeUndefined();
    expect(payload.data.events[0].user.external_id).toBe('user-no-email');
    expect(payload.data.events[0].user.ip_address).toBe('203.0.113.10');
  });

  it('does not send placeholder IDFA/AAID', () => {
    const payload = buildRedditSignUpPayload({
      userId: 'user-1',
      actionSource: 'APP',
      eventAtMs: 1,
      idfa: '00000000-0000-0000-0000-000000000000',
      aaid: '00000000-0000-0000-0000-000000000000',
    });
    expect(payload.data.events[0].user.idfa).toBeUndefined();
    expect(payload.data.events[0].user.aaid).toBeUndefined();
  });

  it('includes test_id only when provided (Events Manager test events)', () => {
    const payload = buildRedditSignUpPayload({
      userId: 'user-1',
      actionSource: 'APP',
      eventAtMs: 1,
      testId: 'test-events-manager',
    });
    expect(payload.data.test_id).toBe('test-events-manager');
  });

  it('adds event_source_url for WEBSITE only', () => {
    const website = buildRedditSignUpPayload({
      userId: 'user-1',
      actionSource: 'WEBSITE',
      eventAtMs: 1,
      eventSourceUrl: 'https://one-more.app/',
    });
    const app = buildRedditSignUpPayload({
      userId: 'user-1',
      actionSource: 'APP',
      eventAtMs: 1,
      eventSourceUrl: 'https://one-more.app/',
    });
    expect(website.data.events[0].event_source_url).toBe(
      'https://one-more.app/',
    );
    expect(app.data.events[0].event_source_url).toBeUndefined();
  });
});

describe('extractRedditAdsContext', () => {
  it('prefers body click id over Reddit pixel cookie', () => {
    const ctx = extractRedditAdsContext({
      headers: {
        origin: 'capacitor://localhost',
        'user-agent': 'OneMore/1.0',
        'x-forwarded-for': '203.0.113.10',
        cookie: '_rdt_cid=from_cookie',
      },
      bodyClickId: 'from_body',
    });
    expect(ctx).toMatchObject({
      clickId: 'from_body',
      actionSource: 'APP',
      ipAddress: '203.0.113.10',
      userAgent: 'OneMore/1.0',
    });
  });
});
