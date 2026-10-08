import {
  fetchSession,
  sessionSwrKey,
  type WorkoutSession,
} from "@/lib/session-api";
import useSWR from "swr";

/** Séance d'un jour donné (même clé SWR que la page séance, cache partagé). */
export function useHomeDaySession(
  ownerUserId: string | undefined,
  dayKey: string | null,
  enabled = true,
) {
  return useSWR<WorkoutSession>(
    enabled && ownerUserId && dayKey ? sessionSwrKey(ownerUserId, dayKey) : null,
    () => fetchSession(ownerUserId!, dayKey!),
  );
}
