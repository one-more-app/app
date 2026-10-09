import { AnalyticsEvents } from "./events";
import { track } from "./track";

export type PushClickSource = "os" | "toast" | "feed";

export type PushClickAnalyticsInput = {
  type?: string;
  template_key?: string;
  campaign_key?: string;
  segment_key?: string;
  outbound_message_id?: string;
};

export type PushFeedAnalytics = {
  templateKey?: string;
  campaignKey?: string;
  segmentKey?: string;
  outboundMessageId?: string;
};

function propsFromFcmData(
  data: Record<string, unknown> | undefined,
): PushClickAnalyticsInput {
  if (!data) return {};
  const out: PushClickAnalyticsInput = {};
  if (typeof data.type === "string" && data.type) out.type = data.type;
  if (typeof data.template_key === "string" && data.template_key) {
    out.template_key = data.template_key;
  }
  if (typeof data.campaign_key === "string" && data.campaign_key) {
    out.campaign_key = data.campaign_key;
  }
  if (typeof data.segment_key === "string" && data.segment_key) {
    out.segment_key = data.segment_key;
  }
  if (typeof data.outbound_message_id === "string" && data.outbound_message_id) {
    out.outbound_message_id = data.outbound_message_id;
  }
  return out;
}

function propsFromFeedAnalytics(
  analytics: PushFeedAnalytics | undefined,
): PushClickAnalyticsInput {
  if (!analytics) return {};
  const out: PushClickAnalyticsInput = {};
  if (analytics.templateKey) out.template_key = analytics.templateKey;
  if (analytics.campaignKey) out.campaign_key = analytics.campaignKey;
  if (analytics.segmentKey) out.segment_key = analytics.segmentKey;
  if (analytics.outboundMessageId) {
    out.outbound_message_id = analytics.outboundMessageId;
  }
  return out;
}

export function trackPushClicked(
  source: PushClickSource,
  input: {
    type: string;
    fcmData?: Record<string, unknown>;
    feedAnalytics?: PushFeedAnalytics;
  },
): void {
  const fromData = propsFromFcmData(input.fcmData);
  const fromFeed = propsFromFeedAnalytics(input.feedAnalytics);

  track(AnalyticsEvents.PUSH_CLICKED, {
    type: input.type || fromData.type || "unknown",
    channel: "push",
    source,
    template_key: fromData.template_key ?? fromFeed.template_key,
    campaign_key: fromData.campaign_key ?? fromFeed.campaign_key,
    segment_key: fromData.segment_key ?? fromFeed.segment_key,
    outbound_message_id:
      fromData.outbound_message_id ?? fromFeed.outbound_message_id,
  });
}
