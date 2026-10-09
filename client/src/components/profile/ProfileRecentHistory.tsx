import { SessionFeed } from "@/components/session/SessionFeed";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePerformanceEntriesData } from "@/hooks/use-api-data";
import { UI } from "@/lib/translations";
import type { PerformanceEntry } from "@/types";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ProfileRecentHistoryProps = {
  entries?: PerformanceEntry[];
  readOnly?: boolean;
  sessionOwnerUserId?: string;
};

export function ProfileRecentHistory({
  entries: entriesProp,
  readOnly = false,
  sessionOwnerUserId,
}: ProfileRecentHistoryProps = {}) {
  const { data: allEntriesFromHook = [] } = usePerformanceEntriesData({
    withLeagueInsights: true,
  });

  const allEntries = entriesProp ?? allEntriesFromHook;

  const entries = useMemo(
    () =>
      allEntries
        .filter((entry) => !entry.deletedAt)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [allEntries],
  );

  const [itemCount, setItemCount] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);

  const onItemsChange = useCallback((count: number, loading: boolean) => {
    setItemCount(count);
    setFeedLoading(loading);
  }, []);

  if (entries.length === 0) return null;
  if (!sessionOwnerUserId) return null;
  if (!feedLoading && itemCount === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>{UI.profileRecentHistory}</CardTitle>
        {!readOnly ? (
          <CardAction>
            <Link
              to="/history"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              {UI.profileHistorySeeAll}
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        <SessionFeed
          ownerUserId={sessionOwnerUserId}
          entries={entries}
          limit={2}
          recapVariant="compact"
          onItemsChange={onItemsChange}
        />
      </CardContent>
    </Card>
  );
}
