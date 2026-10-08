import { HomeDayTitle } from "@/components/home/HomeDayTitle";
import { HomeLastSessionBlock } from "@/components/home/HomeLastSessionBlock";
import { HomeLiveSession } from "@/components/home/HomeLiveSession";
import { HomePastSession } from "@/components/home/HomePastSession";
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
};

export function HomeDayContent({
  kind,
  dayKey,
  ownerUserId,
  entries,
  dayEntries,
  lastSessionDay,
  onSelectDay,
}: HomeDayContentProps) {
  if (kind === "live" && ownerUserId) {
    return (
      <HomeLiveSession
        ownerUserId={ownerUserId}
        dayKey={dayKey}
        todayEntries={dayEntries}
      />
    );
  }

  if ((kind === "session" || kind === "live") && ownerUserId) {
    return (
      <HomePastSession
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

  if (kind === "today-empty") {
    return (
      <>
        <section>
          <HomeDayTitle>{UI.homeTodayTitle}</HomeDayTitle>
          <EmptyState
            icon={Dumbbell}
            title={UI.homeTodayEmptyTitle}
            description={UI.homeTodayEmptyHelp}
            contentClassName="px-6 py-8"
          />
        </section>
        {lastBlock}
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
