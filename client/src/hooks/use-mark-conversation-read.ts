import { CONVERSATIONS_SWR_KEY } from "@/hooks/use-realtime";
import {
  fetchConversations,
  markConversationRead,
  type ConversationListItem,
} from "@/lib/messaging-api";
import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";

export type ConversationsCache = {
  conversations: ConversationListItem[];
};

export function patchConversationUnreadZero(
  current: ConversationsCache | undefined,
  conversationId: string,
): ConversationsCache | undefined {
  if (!current) return current;
  return {
    conversations: current.conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c,
    ),
  };
}

export function useConversationsList() {
  return useSWR<ConversationsCache>(CONVERSATIONS_SWR_KEY, fetchConversations);
}

export function useUnreadMessagesCount(): number {
  const { data } = useConversationsList();
  return (
    data?.conversations?.reduce((total, conversation) => {
      return total + conversation.unreadCount;
    }, 0) ?? 0
  );
}

/** Marque toute la conversation comme lue et synchronise le cache SWR partagé. */
export function useConversationUnreadActions() {
  const { mutate } = useConversationsList();
  const inFlightRef = useRef<Set<string>>(new Set());

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (inFlightRef.current.has(conversationId)) return;
      inFlightRef.current.add(conversationId);

      void mutate(
        (current) => patchConversationUnreadZero(current, conversationId),
        { revalidate: false },
      );

      try {
        await markConversationRead(conversationId);
        await mutate(
          (current) => patchConversationUnreadZero(current, conversationId),
          { revalidate: true },
        );
      } catch {
        await mutate();
      } finally {
        inFlightRef.current.delete(conversationId);
      }
    },
    [mutate],
  );

  return { markAsRead };
}

/** Marque lu tant que le fil de chat est affiché (y compris nouveaux messages). */
export function useConversationReadOnView(
  conversationId: string | undefined,
  messageCount: number,
) {
  const { markAsRead } = useConversationUnreadActions();

  useEffect(() => {
    if (!conversationId) return;
    void markAsRead(conversationId);
  }, [conversationId, messageCount, markAsRead]);
}
