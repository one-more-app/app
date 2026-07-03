import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isFriendSearchReady,
  requestFriend,
  searchUsers,
  type UserSearchResult,
} from "@/lib/social-api";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import { Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function SearchResultRow({
  item,
  onRequest,
  busy,
}: {
  item: UserSearchResult;
  onRequest: () => void;
  busy: boolean;
}) {
  const name = getProfileDisplayName(
    {
      firstName: item.firstName ?? undefined,
      lastName: item.lastName ?? undefined,
      username: item.username ?? undefined,
    },
    null,
  );
  const initials = getProfileInitials(
    {
      firstName: item.firstName ?? undefined,
      lastName: item.lastName ?? undefined,
      username: item.username ?? undefined,
    },
    null,
  );

  let action: ReactNode = (
    <Button size="sm" onClick={onRequest} disabled={busy}>
      {UI.friendAdd}
    </Button>
  );
  if (item.friendshipStatus === "accepted") {
    action = (
      <Button size="sm" variant="secondary" asChild>
        <Link to={`/friends/${item.userId}`}>{UI.friendViewProfile}</Link>
      </Button>
    );
  } else if (item.friendshipStatus === "pending") {
    action = (
      <span className="text-xs text-muted-foreground">
        {item.friendshipDirection === "incoming"
          ? UI.friendRequestPending
          : UI.friendRequestOutgoing}
      </span>
    );
  }

  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 p-3">
      <Link to={`/friends/preview/${item.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
        {item.avatarUrl ? (
          <img
            src={item.avatarUrl}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          {item.username ? (
            <p className="truncate text-xs text-muted-foreground">@{item.username}</p>
          ) : null}
        </div>
      </Link>
      {action}
      </CardContent>
    </Card>
  );
}

export function FriendsSearchTab({
  onRefreshFriends,
  autoFocus = false,
}: {
  onRefreshFriends: () => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const searchReady = isFriendSearchReady(debounced);

  useEffect(() => {
    if (!searchReady) {
      setResults([]);
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const { results: found } = await searchUsers(debounced);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [debounced, searchReady]);

  const handleRequest = (userId: string) => {
    void (async () => {
      setBusyId(userId);
      try {
        await requestFriend(userId);
        toast.success(UI.friendRequestSent);
        onRefreshFriends();
        const { results: found } = await searchUsers(debounced);
        setResults(found);
      } catch {
        toast.error(UI.friendActionError);
      } finally {
        setBusyId(null);
      }
    })();
  };

  return (
    <section className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={UI.friendsSearchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
        />
      </div>
      <p className="text-xs text-muted-foreground">{UI.friendsSearchHint}</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">{UI.loading}</p>
      ) : debounced.length === 0 ? (
        <p className="text-sm text-muted-foreground">{UI.friendsSearchEmpty}</p>
      ) : !searchReady ? (
        <p className="text-sm text-muted-foreground">{UI.friendsSearchMinChars}</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">{UI.friendsSearchNoResults}</p>
      ) : (
        <div className="space-y-2">
          {results.map((item) => (
            <SearchResultRow
              key={item.userId}
              item={item}
              busy={busyId === item.userId}
              onRequest={() => handleRequest(item.userId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
