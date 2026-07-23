import type {
  EventActiveAttempt,
  EventLeaderboardResponse,
} from "@/lib/event-api";
import { getEventRealtimeSocketUrl } from "@/lib/realtime-url";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type UseEventLeaderboardRealtimeOptions = {
  enabled?: boolean;
  onLeaderboard: (payload: EventLeaderboardResponse) => void;
  onAttempt?: (attempt: EventActiveAttempt | null) => void;
};

export function useEventLeaderboardRealtime({
  enabled = true,
  onLeaderboard,
  onAttempt,
}: UseEventLeaderboardRealtimeOptions): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const onLeaderboardRef = useRef(onLeaderboard);
  const onAttemptRef = useRef(onAttempt);

  useEffect(() => {
    onLeaderboardRef.current = onLeaderboard;
    onAttemptRef.current = onAttempt;
  }, [onLeaderboard, onAttempt]);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return undefined;
    }

    const socket: Socket = io(getEventRealtimeSocketUrl(), {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("event:leaderboard", (payload: EventLeaderboardResponse) => {
      onLeaderboardRef.current(payload);
    });

    socket.on(
      "event:attempt",
      (payload: { attempt: EventActiveAttempt | null }) => {
        onAttemptRef.current?.(payload.attempt);
      },
    );

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [enabled]);

  return { connected };
}
