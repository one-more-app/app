import { HomeFirstSessionCard } from "@/components/home/HomeFirstSessionCard";
import { HomeDayTitle } from "@/components/home/HomeDayTitle";
import { HomeDaySessions } from "@/components/home/HomeDaySessions";
import { HomeLastSessionBlock } from "@/components/home/HomeLastSessionBlock";
import { HomeLiveSession } from "@/components/home/HomeLiveSession";
import { EmptyState } from "@/components/ui/empty-state";
import { formatHomeDayTitle, type HomeDayKind } from "@/lib/home-day";
import { UI } from "@/lib/translations";
import type { PerformanceEntry } from "@/types";
import { CalendarDays, Clock, Dumbbell } from "lucide-react";

type HomeDayContentProps = {
  kind: HomeDayKind;
  dayKey: string;
  ownerUserId: string | undefined;
  /** Perfs actives (non supprimées) de l'utilisateur. */
  entries: PerformanceEntry[];
  /** Perfs actives du jour sélectionné. */
  dayEntries: PerformanceEntry[];
  /** Dernier jour avec séance (avant ou à aujourd'hui), s'il existe. */
  lastSessionDay: string | null;
  onSelectDay: (dayKey: string) => void;
  /** Ouvre le parcours d'ajout d'un exercice (catalogue ou tiroir parrainage). */
  onAddExercise: () => void;
  /** Nouvel inscrit : titre « Ta première séance ». Sinon « Ta prochaine séance ». */
  isNewUser?: boolean;
};

export function HomeDayContent({
  kind,
  dayKey,
  ownerUserId,
  entries,
  dayEntries,
  lastSessionDay,
  onSelectDay,
  onAddExercise,
  isNewUser = false,
}: HomeDayContentProps) {
  if (kind === "live" && ownerUserId) {
    return (
      <HomeLiveSession
        ownerUserId={ownerUserId}
        dayKey={dayKey}
        todayEntries={dayEntries}
        onAddExercise={onAddExercise}
      />
    );
  }

  if ((kind === "session" || kind === "live") && ownerUserId) {
    return (
      <HomeDaySessions
        ownerUserId={ownerUserId}
        dayKey={dayKey}
        dayEntries={dayEntries}
        allEntries={entries}
      />
    );
  }

  const lastBlock =
    ownerUserId && lastSessionDay ? (
      <HomeLastSessionBlock
        ownerUserId={ownerUserId}
        dayKey={lastSessionDay}
        entries={entries}
        onSelectDay={onSelectDay}
      />
    ) : null;

  const showReminderCard = kind === "today-empty" || kind === "future";

  if (showReminderCard) {
    return (
      <>
        <HomeFirstSessionCard variant={isNewUser ? "first" : "next"} />
        {isNewUser ? null : lastBlock}
      </>
    );
  }

  const config =
    kind === "rest"
      ? {
          icon: Clock,
          title: UI.homeRestDayTitle,
          description: UI.homeRestDayHelp,
        }
      : kind === "future"
        ? {
            icon: CalendarDays,
            title: UI.homeFutureTitle,
            description: UI.homeFutureHelp,
          }
        : {
            icon: Dumbbell,
            title: UI.homeNoSessionTitle,
            description: undefined,
          };

  return (
    <>
      <section>
        <HomeDayTitle>{formatHomeDayTitle(dayKey)}</HomeDayTitle>
        <EmptyState
          icon={config.icon}
          title={config.title}
          description={config.description}
          contentClassName="px-6 py-6"
        />
      </section>
      {lastBlock}
    </>
  );
}
