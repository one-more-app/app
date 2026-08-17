import { apiFetch } from "@/lib/api";
import { trackMessageSent } from "@/lib/analytics";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type ConversationListItem = {
  id: string;
  otherUser: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
    isPremium: boolean;
  };
  lastMessage: Message | null;
  unreadCount: number;
};

export async function fetchConversations(): Promise<{
  conversations: ConversationListItem[];
}> {
  const data = await apiFetch<{ conversations: ConversationListItem[] }>(
    "/messaging/conversations",
  );
  return {
    conversations: data.conversations.filter((item) => item.lastMessage != null),
  };
}

export async function getOrCreateConversation(userId: string): Promise<{
  id: string;
  otherUser: ConversationListItem["otherUser"];
}> {
  return await apiFetch(`/messaging/conversations/with/${userId}`, {
    method: "POST",
  });
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
): Promise<{ messages: Message[]; nextCursor: string | null }> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return await apiFetch(
    `/messaging/conversations/${conversationId}/messages${params}`,
  );
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ message: Message }> {
  const result = await apiFetch<{ message: Message }>(
    `/messaging/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    },
  );
  trackMessageSent({
    conversationId,
    messageId: result.message.id,
  });
  return result;
}

export async function markConversationRead(
  conversationId: string,
  messageId?: string,
): Promise<{ ok: boolean }> {
  return await apiFetch(`/messaging/conversations/${conversationId}/read`, {
    method: "POST",
    ...(messageId
      ? { body: JSON.stringify({ messageId }) }
      : {}),
  });
}
