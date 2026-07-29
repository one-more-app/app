import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { ProBadge } from "@/components/profile/ProBadge";
import { UsernameLine } from "@/components/profile/UsernameLine";
import { Card, CardContent } from "@/components/ui/card";
import { UnreadCountBadge } from "@/components/ui/unread-count-badge";
import {
  useConversationUnreadActions,
  useConversationsList,
} from "@/hooks/use-mark-conversation-read";
import type { ConversationListItem } from "@/lib/messaging-api";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import { hapticImpact } from "@/lib/haptics";
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
  const profile = {
    firstName: item.otherUser.firstName ?? undefined,
    lastName: item.otherUser.lastName ?? undefined,
    username: item.otherUser.username ?? undefined,
  };
  const name = getProfileDisplayName(profile, null);
  const initials = getProfileInitials(profile, null);
  const showUsername =
    item.otherUser.username &&
    (item.otherUser.firstName || item.otherUser.lastName);

  return (
    <Card className="py-0 transition-colors hover:bg-card/90">
      <CardContent className="flex items-center gap-3 p-3">
        <ProfileAvatarLink
          userId={item.otherUser.userId}
          avatarUrl={item.otherUser.avatarUrl}
          initials={initials}
          linkOptions={{ friendshipStatus: "accepted" }}
          stopPropagation
        />
        <Link
          to={`/friends/chat/${item.id}`}
          className="min-w-0 flex-1"
          onClick={() => {
            void hapticImpact();
            onOpen(item.id);
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 truncate font-medium">{name}</p>
              {item.otherUser.isPremium ? <ProBadge /> : null}
            </div>
            {item.unreadCount > 0 ? (
              <UnreadCountBadge count={item.unreadCount} />
            ) : null}
          </div>
          {showUsername && item.otherUser.username ? (
            <UsernameLine username={item.otherUser.username} />
          ) : null}
          <p className="truncate text-xs text-muted-foreground">
            {item.lastMessage?.body ?? UI.messagesEmptyPreview}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

export function FriendsMessagesTab() {
  const { data, isLoading } = useConversationsList();
  const { markAsRead } = useConversationUnreadActions();
  const conversations =
    data?.conversations.filter((item) => item.lastMessage != null) ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{UI.loading}</p>;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 p-8 text-center">
        <MessageCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{UI.messagesEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((item) => (
        <ConversationRow
          key={item.id}
          item={item}
          onOpen={(id) => void markAsRead(id)}
        />
      ))}
    </div>
  );
}
