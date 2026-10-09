import {
  isOutboundStagingRecipientOverrideActive,
  parseOutboundStagingRecipientIds,
  resolveDispatchRecipientIds,
} from './outbound-staging-recipients.js';

describe('parseOutboundStagingRecipientIds', () => {
  it('parses comma-separated UUIDs with spaces', () => {
    expect(
      parseOutboundStagingRecipientIds('  aaa-111 , bbb-222,  , ccc-333  '),
    ).toEqual(['aaa-111', 'bbb-222', 'ccc-333']);
  });

  it('returns empty for missing or blank', () => {
    expect(parseOutboundStagingRecipientIds(undefined)).toEqual([]);
    expect(parseOutboundStagingRecipientIds('   ')).toEqual([]);
  });
});

describe('isOutboundStagingRecipientOverrideActive', () => {
  it('is inactive in production without opt-in', () => {
    expect(
      isOutboundStagingRecipientOverrideActive({
        NODE_ENV: 'production',
        OUTBOUND_STAGING_RECIPIENT_IDS: 'user-1',
      }),
    ).toBe(false);
  });

  it('is active in production with OUTBOUND_STAGING_RECIPIENT_OVERRIDE=true', () => {
    expect(
      isOutboundStagingRecipientOverrideActive({
        NODE_ENV: 'production',
        OUTBOUND_STAGING_RECIPIENT_IDS: 'user-1',
        OUTBOUND_STAGING_RECIPIENT_OVERRIDE: 'true',
      }),
    ).toBe(true);
  });

  it('is active when not production and ids are set', () => {
    expect(
      isOutboundStagingRecipientOverrideActive({
        NODE_ENV: 'staging',
        OUTBOUND_STAGING_RECIPIENT_IDS: 'user-1,user-2',
      }),
    ).toBe(true);
  });
});

describe('resolveDispatchRecipientIds', () => {
  it('forces staging list instead of segment', () => {
    expect(
      resolveDispatchRecipientIds(['seg-a', 'seg-b'], {
        NODE_ENV: 'development',
        OUTBOUND_STAGING_RECIPIENT_IDS: 'test-only',
      }),
    ).toEqual(['test-only']);
  });

  it('keeps segment in production without opt-in', () => {
    expect(
      resolveDispatchRecipientIds(['seg-a'], {
        NODE_ENV: 'production',
        OUTBOUND_STAGING_RECIPIENT_IDS: 'test-only',
      }),
    ).toEqual(['seg-a']);
  });

  it('forces list in production with opt-in', () => {
    expect(
      resolveDispatchRecipientIds(['seg-a'], {
        NODE_ENV: 'production',
        OUTBOUND_STAGING_RECIPIENT_IDS: 'test-only',
        OUTBOUND_STAGING_RECIPIENT_OVERRIDE: 'true',
      }),
    ).toEqual(['test-only']);
  });
});
