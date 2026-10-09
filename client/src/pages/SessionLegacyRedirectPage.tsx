import { HistoryPageSkeleton } from "@/components/skeletons";
import { resolveSessionIdForDay, sessionPath } from "@/lib/session-api";
import { UI } from "@/lib/translations";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

/**
 * Redirect legacy `/session/:ownerUserId/:date` (+ `/recap`)
 * vers `/session/:sessionId`.
 */
export default function SessionLegacyRedirectPage() {
  const { ownerUserId, date } = useParams<{
    ownerUserId: string;
    date: string;
  }>();
  const [sessionId, setSessionId] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!ownerUserId || !date) {
      setSessionId(null);
      return;
    }
    let cancelled = false;
    void resolveSessionIdForDay(ownerUserId, date)
      .then((id) => {
        if (!cancelled) setSessionId(id);
      })
      .catch(() => {
        if (!cancelled) setSessionId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUserId, date]);

  if (!ownerUserId || !date) {
    return <Navigate to="/home" replace />;
  }

  if (sessionId === undefined) {
    return (
      <div className="min-h-screen-app bg-background">
        <HistoryPageSkeleton />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen-app bg-background p-4">
        <p className="text-sm text-destructive">{UI.sessionUnavailable}</p>
      </div>
    );
  }

  return <Navigate to={sessionPath(sessionId)} replace />;
}
