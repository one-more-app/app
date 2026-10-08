import type { ServerAnalyticsProperties } from '../analytics/analytics.service.js';

/** Metadata for OpenPanel + FCM data (outbound marketing / lifecycle with template). */
export type PushAnalyticsPayload = {
  templateKey?: string;
  campaignKey?: string;
  segmentKey?: string;
  outboundMessageId?: string;
};

export function compactPushAnalytics(
  analytics?: PushAnalyticsPayload | null,
): PushAnalyticsPayload | undefined {
  if (!analytics) return undefined;
  const out: PushAnalyticsPayload = {};
  if (analytics.templateKey?.trim())
    out.templateKey = analytics.templateKey.trim();
  if (analytics.campaignKey?.trim())
    out.campaignKey = analytics.campaignKey.trim();
  if (analytics.segmentKey?.trim())
    out.segmentKey = analytics.segmentKey.trim();
  if (analytics.outboundMessageId?.trim()) {
    out.outboundMessageId = analytics.outboundMessageId.trim();
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** FCM data payload values must be strings. */
export function pushAnalyticsToFcmData(
  analytics?: PushAnalyticsPayload | null,
): Record<string, string> {
  const compact = compactPushAnalytics(analytics);
  if (!compact) return {};
  const data: Record<string, string> = {};
  if (compact.templateKey) data.template_key = compact.templateKey;
  if (compact.campaignKey) data.campaign_key = compact.campaignKey;
  if (compact.segmentKey) data.segment_key = compact.segmentKey;
  if (compact.outboundMessageId) {
    data.outbound_message_id = compact.outboundMessageId;
  }
  return data;
}

export function toPushAnalyticsOpenPanelProps(
  analytics?: PushAnalyticsPayload | null,
): ServerAnalyticsProperties {
  const compact = compactPushAnalytics(analytics);
  if (!compact) return {};
  const props: ServerAnalyticsProperties = {};
  if (compact.templateKey) props.template_key = compact.templateKey;
  if (compact.campaignKey) props.campaign_key = compact.campaignKey;
  if (compact.segmentKey) props.segment_key = compact.segmentKey;
  return props;
}
