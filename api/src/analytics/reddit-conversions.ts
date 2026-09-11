import { createHash } from 'crypto';

export type RedditActionSource = 'WEBSITE' | 'APP';

export type RedditSignUpInput = {
  userId: string;
  email?: string | null;
  ipAddress?: string;
  userAgent?: string;
  clickId?: string;
  idfa?: string;
  aaid?: string;
  actionSource: RedditActionSource;
  eventAtMs: number;
  eventSourceUrl?: string;
  testId?: string;
};

type RedditUserPayload = {
  email?: string;
  ip_address?: string;
  user_agent?: string;
  external_id: string;
  idfa?: string;
  aaid?: string;
};

type RedditSignUpEvent = {
  event_at: number;
  action_source: RedditActionSource;
  type: { tracking_type: 'SIGN_UP' };
  click_id?: string;
  event_source_url?: string;
  user: RedditUserPayload;
  metadata: { conversion_id: string };
};

export type RedditSignUpPayload = {
  data: {
    test_id?: string;
    events: RedditSignUpEvent[];
  };
};

const ZERO_MAID = '00000000-0000-0000-0000-000000000000';

export function canonicalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;
  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain.includes('.')) return null;
  const plus = local.indexOf('+');
  if (plus >= 0) local = local.slice(0, plus);
  local = local.replace(/\./g, '');
  if (!local) return null;
  return `${local}@${domain}`;
}

export function hashEmailForReddit(email: string): string | null {
  const canonical = canonicalizeEmail(email);
  if (!canonical) return null;
  return createHash('sha256').update(canonical).digest('hex');
}

function firstHeaderValue(
  value: string | string[] | number | undefined,
): string | undefined {
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value[0]?.trim() || undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function stripIpv6Mapped(ip: string): string {
  if (ip.toLowerCase().startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function isLoopbackIp(ip: string): boolean {
  const normalized = stripIpv6Mapped(ip).toLowerCase();
  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === 'localhost' ||
    normalized.startsWith('127.')
  );
}

export function clientIpFromHeaders(
  headers: Record<string, string | string[] | number | undefined>,
  fallback?: string,
): string | undefined {
  const forwarded = firstHeaderValue(headers['x-forwarded-for']);
  if (forwarded) {
    const hops = forwarded
      .split(',')
      .map((part) => stripIpv6Mapped(part.trim()))
      .filter(Boolean);
    const publicHop = hops.find((ip) => !isLoopbackIp(ip));
    if (publicHop) return publicHop;
  }

  const realIp = firstHeaderValue(headers['x-real-ip']);
  if (realIp) {
    const normalized = stripIpv6Mapped(realIp);
    if (!isLoopbackIp(normalized)) return normalized;
  }

  if (fallback) {
    const normalized = stripIpv6Mapped(fallback);
    if (!isLoopbackIp(normalized)) return normalized;
  }

  return undefined;
}

export function redditActionSourceFromOrigin(
  origin: string | undefined,
): RedditActionSource {
  if (!origin) return 'APP';
  const normalized = origin.trim().toLowerCase();
  if (
    normalized.startsWith('capacitor:') ||
    normalized.startsWith('ionic:') ||
    normalized.startsWith('one-more:')
  ) {
    return 'APP';
  }
  if (
    normalized.startsWith('https://') &&
    !normalized.includes('localhost') &&
    !normalized.includes('127.0.0.1')
  ) {
    return 'WEBSITE';
  }
  return 'APP';
}

export function isPlaceholderAdvertisingId(id: string): boolean {
  return id.trim().toLowerCase() === ZERO_MAID;
}

function optionalAdvertisingId(id: string | undefined): string | undefined {
  const trimmed = id?.trim();
  if (!trimmed) return undefined;
  if (isPlaceholderAdvertisingId(trimmed)) return undefined;
  return trimmed;
}

export function redditSignupConversionId(userId: string): string {
  return `signup:${userId}`;
}

export type RedditAdsRequestContext = {
  ipAddress?: string;
  userAgent?: string;
  clickId?: string;
  idfa?: string;
  aaid?: string;
  actionSource: RedditActionSource;
};

function cookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    if (rawKey?.trim() !== name) continue;
    const value = rest.join('=').trim();
    if (value) return decodeURIComponent(value);
  }
  return undefined;
}

export function extractRedditAdsContext(input: {
  headers: Record<string, string | string[] | number | undefined>;
  ip?: string;
  bodyClickId?: string;
  bodyIdfa?: string;
  bodyAaid?: string;
}): RedditAdsRequestContext {
  const cookieHeader = firstHeaderValue(input.headers.cookie);
  const clickId =
    input.bodyClickId?.trim() ||
    cookieValue(cookieHeader, '_rdt_cid') ||
    cookieValue(cookieHeader, 'rdt_cid') ||
    undefined;
  const origin = firstHeaderValue(input.headers.origin);
  const userAgent = firstHeaderValue(input.headers['user-agent']);
  const idfa = optionalAdvertisingId(input.bodyIdfa);
  const aaid = optionalAdvertisingId(input.bodyAaid);

  return {
    ipAddress: clientIpFromHeaders(input.headers, input.ip),
    userAgent,
    clickId,
    idfa,
    aaid,
    actionSource: redditActionSourceFromOrigin(origin),
  };
}

export function buildRedditSignUpPayload(
  input: RedditSignUpInput,
): RedditSignUpPayload {
  const user: RedditUserPayload = {
    external_id: input.userId,
  };

  const hashedEmail = input.email ? hashEmailForReddit(input.email) : null;
  if (hashedEmail) user.email = hashedEmail;
  if (input.ipAddress) user.ip_address = input.ipAddress;
  if (input.userAgent) user.user_agent = input.userAgent;

  const idfa = optionalAdvertisingId(input.idfa);
  const aaid = optionalAdvertisingId(input.aaid);
  if (idfa) user.idfa = idfa;
  if (aaid) user.aaid = aaid;

  const event: RedditSignUpEvent = {
    event_at: input.eventAtMs,
    action_source: input.actionSource,
    type: { tracking_type: 'SIGN_UP' },
    user,
    metadata: { conversion_id: redditSignupConversionId(input.userId) },
  };

  const clickId = input.clickId?.trim();
  if (clickId) event.click_id = clickId;

  if (input.actionSource === 'WEBSITE' && input.eventSourceUrl?.trim()) {
    event.event_source_url = input.eventSourceUrl.trim();
  }

  const payload: RedditSignUpPayload = {
    data: { events: [event] },
  };
  const testId = input.testId?.trim();
  if (testId) payload.data.test_id = testId;
  return payload;
}
