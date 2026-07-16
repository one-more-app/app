import { UI } from "@/lib/translations";
import type { SessionDurationLabels } from "@one-more/shared/session-timing";

export function sessionDurationLabels(): SessionDurationLabels {
  return {
    minutes: (count) =>
      UI.sessionDurationMinutes.replace("{count}", String(count)),
    hours: (hours, minutes) =>
      minutes > 0
        ? UI.sessionDurationHours
            .replace("{hours}", String(hours))
            .replace("{minutes}", String(minutes).padStart(2, "0"))
        : UI.sessionDurationHoursNoMinutes.replace("{hours}", String(hours)),
    inProgress: UI.sessionInProgress,
    inProgressWithDuration: (duration) =>
      UI.sessionInProgressWithDuration.replace("{duration}", duration),
  };
}
