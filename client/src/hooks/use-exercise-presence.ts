import { useRealtime } from "@/hooks/use-realtime";
import { useEffect } from "react";

export function useExercisePresence(
  active: boolean,
  exerciseName?: string,
  trackedExerciseId?: string,
) {
  const { emitPresenceHeartbeat } = useRealtime();

  useEffect(() => {
    if (!active) {
      emitPresenceHeartbeat({ status: "online" });
      return;
    }

    emitPresenceHeartbeat({
      status: "training",
      exerciseName,
      trackedExerciseId,
    });

    const interval = window.setInterval(() => {
      emitPresenceHeartbeat({
        status: "training",
        exerciseName,
        trackedExerciseId,
      });
    }, 30_000);

    return () => {
      window.clearInterval(interval);
      emitPresenceHeartbeat({ status: "online" });
    };
  }, [
    active,
    exerciseName,
    trackedExerciseId,
    emitPresenceHeartbeat,
  ]);
}
