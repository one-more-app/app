import { useAuth } from "@/hooks/use-auth";
import { isGymNotificationsPromptDone } from "@/lib/storage";
import { useEffect, useState } from "react";

/** True quand l'utilisateur a passé l'écran push de l'onboarding salle. */
export function useGymNotificationsReady(): boolean {
  const auth = useAuth();
  const [promptDone, setPromptDone] = useState(() =>
    isGymNotificationsPromptDone(),
  );

  useEffect(() => {
    const sync = () => {
      setPromptDone(isGymNotificationsPromptDone());
    };
    window.addEventListener(
      "one-more:gym-notifications-prompt-done",
      sync,
    );
    return () => {
      window.removeEventListener(
        "one-more:gym-notifications-prompt-done",
        sync,
      );
    };
  }, []);

  return auth.status === "authenticated" && promptDone;
}
