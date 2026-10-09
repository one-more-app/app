import {
  daySessionsSwrKey,
  fetchDaySessions,
  fetchSessionById,
  sessionSwrKeyById,
  type DaySessionSummary,
  type WorkoutSession,
} from "@/lib/session-api";
import { useMemo } from "react";
import useSWR from "swr";

/** Liste des séances first-class d'un jour. */
export function useDaySessions(
  ownerUserId: string | undefined,
  dayKey: string | null,
  enabled = true,
) {
  return useSWR<{ items: DaySessionSummary[] }>(
    enabled && ownerUserId && dayKey
      ? daySessionsSwrKey(ownerUserId, dayKey)
      : null,
    () => fetchDaySessions(ownerUserId!, dayKey!),
  );
}

/** Séance live du jour, sinon la plus récente. */
export function pickPrimaryDaySession(
  items: DaySessionSummary[],
): DaySessionSummary | null {
  if (items.length === 0) return null;
  return items.find((item) => item.isLive) ?? items[items.length - 1]!;
}

/** Détail d'une séance by id (cache SWR partagé avec la page séance). */
export function useHomeSessionById(sessionId: string | undefined) {
  return useSWR<WorkoutSession>(
    sessionId ? sessionSwrKeyById(sessionId) : null,
    () => fetchSessionById(sessionId!),
  );
}

/**
 * Résout la séance à afficher sur l'accueil pour un jour :
 * live si présente, sinon la dernière du jour.
 */
export function useHomePrimarySession(
  ownerUserId: string | undefined,
  dayKey: string | null,
  enabled = true,
) {
  const list = useDaySessions(ownerUserId, dayKey, enabled);
  const primary = useMemo(
    () => pickPrimaryDaySession(list.data?.items ?? []),
    [list.data?.items],
  );
  const session = useHomeSessionById(primary?.id);
  return {
    ...session,
    primary,
    dayItems: list.data?.items ?? [],
    listLoading: list.isLoading,
    listError: list.error,
  };
}
