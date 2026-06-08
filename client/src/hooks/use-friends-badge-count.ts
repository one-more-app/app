import { fetchFriendsList } from "@/lib/social-api";
import { useUnreadMessagesCount } from "@/hooks/use-mark-conversation-read";
import useSWR from "swr";

export function useFriendsBadgeCount() {
  const unreadMessages = useUnreadMessagesCount();
  const { data } = useSWR("friends-list", fetchFriendsList);
  const pendingRequests = data?.pendingIncoming.length ?? 0;
  return pendingRequests + unreadMessages;
}

export function usePendingFriendRequestsCount() {
  const { data } = useSWR("friends-list", fetchFriendsList);
  return data?.pendingIncoming.length ?? 0;
}
