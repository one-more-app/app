import { AnalyticsEvents } from "./events";
import { track } from "./track";

export type FriendInviteShareMethod = "native" | "web" | "clipboard" | "copy_code";

export type FriendRequestSource = "search" | "suggestions" | "user_preview";

export type FriendAcceptSource = "friends_list" | "user_preview";

export function trackFriendInviteSent(params: {
  method: FriendInviteShareMethod;
}): void {
  track(AnalyticsEvents.FRIEND_INVITE_SENT, {
    method: params.method,
  });
}

export function trackFriendRequestSent(params: {
  targetUserId: string;
  friendshipId: string;
  source?: FriendRequestSource;
}): void {
  track(AnalyticsEvents.FRIEND_REQUEST_SENT, {
    target_user_id: params.targetUserId,
    friendship_id: params.friendshipId,
    ...(params.source ? { source: params.source } : {}),
  });
}

export function trackFriendRequestAccepted(params: {
  friendshipId: string;
  requesterUserId?: string;
  source?: FriendAcceptSource;
}): void {
  track(AnalyticsEvents.FRIEND_REQUEST_ACCEPTED, {
    friendship_id: params.friendshipId,
    ...(params.requesterUserId
      ? { requester_user_id: params.requesterUserId }
      : {}),
    ...(params.source ? { source: params.source } : {}),
  });
}

export function trackMessageSent(params: {
  conversationId: string;
  messageId: string;
  recipientUserId?: string;
}): void {
  track(AnalyticsEvents.MESSAGE_SENT, {
    conversation_id: params.conversationId,
    message_id: params.messageId,
    ...(params.recipientUserId
      ? { recipient_user_id: params.recipientUserId }
      : {}),
  });
}

export function trackShareTriggered(params: {
  kind: string;
  result: "shared" | "downloaded";
}): void {
  track(AnalyticsEvents.SHARE_TRIGGERED, {
    kind: params.kind,
    result: params.result,
  });
}
