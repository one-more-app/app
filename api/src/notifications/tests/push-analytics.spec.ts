import { describe, expect, it } from '@jest/globals';
import {
  compactPushAnalytics,
  pushAnalyticsToFcmData,
  toPushAnalyticsOpenPanelProps,
} from '../push-analytics.js';

describe('push-analytics', () => {
  it('omits empty analytics fields from FCM data', () => {
    expect(pushAnalyticsToFcmData(undefined)).toEqual({});
    expect(
      pushAnalyticsToFcmData({
        templateKey: ' weekly_recap ',
        campaignKey: '',
        segmentKey: 'registered_no_exercise',
      }),
    ).toEqual({
      template_key: 'weekly_recap',
      segment_key: 'registered_no_exercise',
    });
  });

  it('maps all outbound keys to snake_case strings', () => {
    expect(
      pushAnalyticsToFcmData({
        templateKey: 'd1_morning',
        campaignKey: 'n8n:no-exo',
        segmentKey: 'registered_no_exercise',
        outboundMessageId: 'msg-1',
      }),
    ).toEqual({
      template_key: 'd1_morning',
      campaign_key: 'n8n:no-exo',
      segment_key: 'registered_no_exercise',
      outbound_message_id: 'msg-1',
    });
  });

  it('builds OpenPanel props without undefined keys', () => {
    expect(toPushAnalyticsOpenPanelProps({ templateKey: 'x' })).toEqual({
      template_key: 'x',
    });
    expect(compactPushAnalytics({ campaignKey: '  ' })).toBeUndefined();
  });
});
