import { useAuth } from "@/hooks/use-auth";
import { useReferralDrawer } from "@/hooks/use-referral-drawer";
import { subscribeAppStateChange } from "@/lib/app-state-listener";
import { getRealtimeSocketUrl } from "@/lib/realtime-url";
import type { Message } from "@/lib/messaging-api";
import { TSHIRT_REWARD_SWR_KEY } from "@/lib/rewards-api";
import type { SessionComment } from "@/lib/session-api";
import { ACCESS_SWR_KEY } from "@/lib/social-api";
import { tshirtClaimPath } from "@/lib/tshirt-claim-route";
import type { FriendPresence } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { useSWRConfig } from "swr";

type RealtimeContextValue = {
  connected: boolean;
  emitPresenceHeartbeat: (payload: {
    status: "online" | "training" | "offline";
    exerciseName?: string;
    trackedExerciseId?: string;
  }) => void;
  joinConversation: (conversationId: string) => void;
  joinSession: (ownerUserId: string, date: string) => void;
  leaveSession: (ownerUserId: string, date: string) => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const CONVERSATIONS_SWR_KEY = "messaging-conversations";
export const FRIENDS_PRESENCE_SWR_KEY = "friends-presence";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { closeReferralDrawer } = useReferralDrawer();
  const { mutate } = useSWRConfig();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated" || !auth.accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(getRealtimeSocketUrl(), {
      auth: { token: auth.accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("presence:heartbeat", { status: "online" });
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("message:new", (payload: { message: Message }) => {
      void mutate(CONVERSATIONS_SWR_KEY);
      void mutate(
        (key) =>
          Array.isArray(key) &&
          key[0] === "chat-messages" &&
          key[1] === payload.message.conversationId,
      );
    });

    socket.on(
      "message:read",
      (payload: { conversationId: string; messageId: string }) => {
        void mutate(CONVERSATIONS_SWR_KEY);
        void mutate(["chat-messages", payload.conversationId]);
      },
    );

    socket.on("presence:update", (payload: { presence: FriendPresence }) => {
      void mutate(
        FRIENDS_PRESENCE_SWR_KEY,
        (current: { items: FriendPresence[] } | undefined) => {
          if (!current) return current;
          return {
            items: current.items.map((p) =>
              p.userId === payload.presence.userId ? payload.presence : p,
            ),
          };
        },
        { revalidate: false },
      );
    });

    socket.on("friendship:updated", () => {
      void mutate("friends-list");
    });

    socket.on(
      "access:updated",
      (payload: { reason: string; tshirtUnlocked?: boolean }) => {
        void mutate(ACCESS_SWR_KEY);
        void mutate(TSHIRT_REWARD_SWR_KEY);
        if (payload.tshirtUnlocked) {
          closeReferralDrawer();
          navigate(tshirtClaimPath("referral_limited"));
        }
      },
    );

    socket.on(
      "session:perf",
      (payload: { ownerUserId: string; date: string; entry: unknown }) => {
        window.dispatchEvent(
          new CustomEvent("one-more:session-perf", { detail: payload }),
        );
      },
    );

    socket.on(
      "session:comment",
      (payload: {
        ownerUserId: string;
        date: string;
        comment: SessionComment;
      }) => {
        window.dispatchEvent(
          new CustomEvent("one-more:session-comment", { detail: payload }),
        );
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [
    auth.status,
    auth.accessToken,
    mutate,
    closeReferralDrawer,
    navigate,
  ]);

  useEffect(() => {
    if (auth.status !== "authenticated") return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        socketRef.current?.emit("presence:heartbeat", { status: "online" });
      } else {
        socketRef.current?.emit("presence:heartbeat", { status: "offline" });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    const removeAppListener = subscribeAppStateChange((isActive) => {
      socketRef.current?.emit("presence:heartbeat", {
        status: isActive ? "online" : "offline",
      });
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      removeAppListener();
    };
  }, [auth.status]);

  const emitPresenceHeartbeat = useCallback(
    (payload: {
      status: "online" | "training" | "offline";
      exerciseName?: string;
      trackedExerciseId?: string;
    }) => {
      socketRef.current?.emit("presence:heartbeat", payload);
    },
    [],
  );

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:join", { conversationId });
  }, []);

  const joinSession = useCallback((ownerUserId: string, date: string) => {
    socketRef.current?.emit("session:join", { ownerUserId, date });
  }, []);

  const leaveSession = useCallback((ownerUserId: string, date: string) => {
    socketRef.current?.emit("session:leave", { ownerUserId, date });
  }, []);

  const value: RealtimeContextValue = {
    connected,
    emitPresenceHeartbeat,
    joinConversation,
    joinSession,
    leaveSession,
  };

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return ctx;
}
