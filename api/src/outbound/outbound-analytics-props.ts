import type { ServerAnalyticsProperties } from '../analytics/analytics.service.js';
import type { OutboundDispatchEntity } from './entities/outbound-dispatch.entity.js';

export function outboundEmailSesTags(params: {
  userId: string;
  templateKey: string;
  outboundMessageId: string;
  dispatch: Pick<OutboundDispatchEntity, 'campaignKey' | 'segmentKey'> | null;
}): Record<string, string> {
  const tags: Record<string, string> = {
    userId: params.userId,
    templateKey: params.templateKey,
    outboundMessageId: params.outboundMessageId,
    campaignKey: params.dispatch?.campaignKey?.trim() || 'single',
  };
  const segment = params.dispatch?.segmentKey?.trim();
  if (segment) tags.segmentKey = segment;
  return tags;
}

export function outboundEmailOpenPanelProps(params: {
  templateKey: string;
  dispatch: Pick<OutboundDispatchEntity, 'campaignKey' | 'segmentKey'> | null;
}): ServerAnalyticsProperties {
  const props: ServerAnalyticsProperties = {
    template_key: params.templateKey,
    channel: 'email',
  };
  const campaign = params.dispatch?.campaignKey?.trim();
  const segment = params.dispatch?.segmentKey?.trim();
  if (campaign) props.campaign_key = campaign;
  if (segment) props.segment_key = segment;
  return props;
}

export function outboundPushAnalytics(params: {
  templateKey: string;
  outboundMessageId: string;
  dispatch: Pick<OutboundDispatchEntity, 'campaignKey' | 'segmentKey'> | null;
}) {
  return {
    templateKey: params.templateKey,
    outboundMessageId: params.outboundMessageId,
    campaignKey: params.dispatch?.campaignKey?.trim() || undefined,
    segmentKey: params.dispatch?.segmentKey?.trim() || undefined,
  };
}
