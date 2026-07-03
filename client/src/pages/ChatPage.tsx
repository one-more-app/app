import { BackHeader } from "@/components/BackHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  useConversationReadOnView,
  useConversationsList,
} from "@/hooks/use-mark-conversation-read";
import { useRealtime } from "@/hooks/use-realtime";
import { fetchMessages, sendMessage, type Message } from "@/lib/messaging-api";
import { getProfileDisplayName } from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const auth = useAuth();
  const { joinConversation } = useRealtime();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useConversationsList();
  const conversation = conversationsData?.conversations.find(
    (c) => c.id === conversationId,
  );

  const { data, mutate } = useSWR(
    conversationId ? ["chat-messages", conversationId] : null,
    () => fetchMessages(conversationId!),
  );

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
  }, [conversationId, joinConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  useConversationReadOnView(conversationId, data?.messages.length ?? 0);

  const title = conversation
    ? getProfileDisplayName(
        {
          firstName: conversation.otherUser.firstName ?? undefined,
          lastName: conversation.otherUser.lastName ?? undefined,
          username: conversation.otherUser.username ?? undefined,
        },
        null,
      )
    : UI.messagesTitle;

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !conversationId || sending) return;
    void (async () => {
      setSending(true);
      try {
        const { message } = await sendMessage(conversationId, body);
        setDraft("");
        await mutate(
          (prev) =>
            prev
              ? { ...prev, messages: [...prev.messages, message] }
              : { messages: [message], nextCursor: null },
          { revalidate: false },
        );
      } finally {
        setSending(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen-app flex-col bg-background">
      <BackHeader
        title={title}
        right={
          conversation ? (
            <Button variant="ghost" size="icon" asChild>
              <Link
                to={`/friends/${conversation.otherUser.userId}`}
                aria-label={UI.friendViewProfile}
              >
                <User className="size-4" />
              </Link>
            </Button>
          ) : null
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-3">
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-4">
          {(data?.messages ?? []).map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.senderId === auth.user?.id}
            />
          ))}
          <div ref={bottomRef} />
        </div>
        <form
          className="sticky-bottom-safe flex gap-2 border-t border-border bg-background pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={UI.messageInputPlaceholder}
            maxLength={2000}
          />
          <Button type="submit" disabled={sending || !draft.trim()}>
            {UI.messageSend}
          </Button>
        </form>
      </main>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {message.body}
      </div>
    </div>
  );
}
