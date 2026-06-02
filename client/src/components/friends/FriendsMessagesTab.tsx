import {
  useConversationUnreadActions,
  useConversationsList,
} from "@/hooks/use-mark-conversation-read";
import type { ConversationListItem } from "@/lib/messaging-api";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import useSWR from "swr";

function ConversationRow({
  item,
  onOpen,
}: {
  item: ConversationListItem;
  onOpen: (conversationId: string) => void;
}) {
  const name = getProfileDisplayName(
    {
      firstName: item.otherUser.firstName ?? undefined,
      lastName: item.otherUser.lastName ?? undefined,
    },
    item.otherUser.username,
  );
  const initials = getProfileInitials(
    {
      firstName: item.otherUser.firstName ?? undefined,
      lastName: item.otherUser.lastName ?? undefined,
    },
    item.otherUser.username,
  );

  return (
    <Link
      to={`/friends/chat/${item.id}`}
      className="flex items-center gap-3 rounded-xl bg-card p-3"
      onClick={() => onOpen(item.id)}
    >
      {item.otherUser.avatarUrl ? (
        <img
          src={item.otherUser.avatarUrl}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{name}</p>
          {item.unreadCount > 0 ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {item.unreadCount > 9 ? "9+" : item.unreadCount}
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {item.lastMessage?.body ?? UI.messagesEmptyPreview}
        </p>
      </div>
    </Link>
  );
}

export function FriendsMessagesTab() {
  const { data, isLoading } = useConversationsList();
  const { markAsRead } = useConversationUnreadActions();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{UI.loading}</p>;
  }

  if ((data?.conversations.length ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 p-8 text-center">
        <MessageCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{UI.messagesEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data!.conversations.map((item) => (
        <ConversationRow
          key={item.id}
          item={item}
          onOpen={(id) => void markAsRead(id)}
        />
      ))}
    </div>
  );
}
