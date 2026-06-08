import { Button } from "@/components/ui/button";
import {
  disableTrainingAlert,
  enableTrainingAlert,
  fetchNotificationPreferences,
  fetchTrainingAlertFriendIds,
} from "@/lib/notifications-api";
import { UI } from "@/lib/translations";
import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

type FriendTrainingBellProps = {
  friendId: string;
};

export function FriendTrainingBell({ friendId }: FriendTrainingBellProps) {
  const { data: friendIds, mutate } = useSWR(
    "training-alert-friends",
    fetchTrainingAlertFriendIds,
  );
  const { data: prefs } = useSWR(
    "notification-preferences",
    fetchNotificationPreferences,
  );
  const [busy, setBusy] = useState(false);

  const subscribed = friendIds?.includes(friendId) ?? false;
  const masterEnabled = prefs?.friendTraining ?? true;
  const disabled = !masterEnabled || busy;

  const handleToggle = () => {
    void (async () => {
      if (!masterEnabled) {
        toast.message(UI.notifFriendTrainingMasterOff);
        return;
      }
      setBusy(true);
      try {
        if (subscribed) {
          await disableTrainingAlert(friendId);
          await mutate(
            (friendIds ?? []).filter((id) => id !== friendId),
            false,
          );
          toast.success(UI.notifFriendTrainingOff);
        } else {
          await enableTrainingAlert(friendId);
          await mutate([...(friendIds ?? []), friendId], false);
          toast.success(UI.notifFriendTrainingOn);
        }
      } catch {
        toast.error(UI.friendActionError);
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <Button
      type="button"
      variant={subscribed ? "default" : "outline"}
      size="icon"
      disabled={disabled}
      onClick={handleToggle}
      aria-pressed={subscribed}
      aria-label={
        subscribed
          ? UI.notifFriendTrainingBellOff
          : UI.notifFriendTrainingBellOn
      }
      title={
        !masterEnabled
          ? UI.notifFriendTrainingMasterOff
          : subscribed
            ? UI.notifFriendTrainingBellOff
            : UI.notifFriendTrainingBellOn
      }
    >
      {subscribed ? (
        <Bell className="size-4" aria-hidden />
      ) : (
        <BellOff className="size-4" aria-hidden />
      )}
    </Button>
  );
}
