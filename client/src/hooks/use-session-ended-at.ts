import { useAuth } from "@/hooks/use-auth";
import { useHomeDaySession } from "@/hooks/use-home-day-session";
import { readStoredSession } from "@/lib/auth";

/**
 * Fin explicite (API) de la séance d'un jour de l'utilisateur connecté.
 * Partage le cache SWR de la page séance. Ne requête que si `enabled`
 * (typiquement : il y a des perfs ce jour-là).
 */
export function useOwnSessionEndedAt(
  dayKey: string | null,
  enabled: boolean,
): string | null {
  const auth = useAuth();
  const ownerUserId =
    (auth.status === "authenticated" ? auth.user?.id : undefined) ??
    readStoredSession()?.user.id;
  const { data } = useHomeDaySession(ownerUserId, dayKey, enabled);
  return data?.endedAt ?? null;
}
