import { describe, expect, it } from '@jest/globals';
import {
  outboundEmailOpenPanelProps,
  outboundEmailSesTags,
} from '../outbound-analytics-props.js';

describe('outbound-analytics-props', () => {
  it('uses real campaign and segment keys in SES tags, not dispatch UUID', () => {
    const tags = outboundEmailSesTags({
      userId: 'u1',
      templateKey: 'lapsed_d48h',
      outboundMessageId: 'm1',
      dispatch: {
        campaignKey: 'n8n:lapsed-after-session',
        segmentKey: 'lapsed_after_session',
      },
    });
    expect(tags.campaignKey).toBe('n8n:lapsed-after-session');
    expect(tags.segmentKey).toBe('lapsed_after_session');
    expect(tags.userId).toBe('u1');
  });

  it('defaults campaign to single and omits empty segment', () => {
    const tags = outboundEmailSesTags({
      userId: 'u1',
      templateKey: 'solo',
      outboundMessageId: 'm1',
      dispatch: null,
    });
    expect(tags).toEqual({
      userId: 'u1',
      templateKey: 'solo',
      outboundMessageId: 'm1',
      campaignKey: 'single',
    });
    expect('segmentKey' in tags).toBe(false);
  });

  it('adds campaign_key and segment_key to email OpenPanel props', () => {
    expect(
      outboundEmailOpenPanelProps({
        templateKey: 'weekly_recap',
        dispatch: {
          campaignKey: 'cron:weekly',
          segmentKey: 'active_users',
        },
      }),
    ).toEqual({
      template_key: 'weekly_recap',
      channel: 'email',
      campaign_key: 'cron:weekly',
      segment_key: 'active_users',
    });
  });
});
