import { apiFetch } from "@/lib/api";

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
  };
  lastMessage: Message | null;
  unreadCount: number;
};

export async function fetchConversations(): Promise<{
  conversations: ConversationListItem[];
}> {
  return await apiFetch("/messaging/conversations");
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
  return await apiFetch(`/messaging/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
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
