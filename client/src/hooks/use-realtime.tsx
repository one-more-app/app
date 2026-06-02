import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/hooks/use-auth";
import { getRealtimeSocketUrl } from "@/lib/realtime-url";
import type { Message } from "@/lib/messaging-api";
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
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const CONVERSATIONS_SWR_KEY = "messaging-conversations";
export const FRIENDS_PRESENCE_SWR_KEY = "friends-presence";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
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

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [auth.status, auth.accessToken, mutate]);

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

    let removeAppListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        socketRef.current?.emit("presence:heartbeat", {
          status: isActive ? "online" : "offline",
        });
      }).then((h) => {
        removeAppListener = () => void h.remove();
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      removeAppListener?.();
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

  const value: RealtimeContextValue = {
    connected,
    emitPresenceHeartbeat,
    joinConversation,
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
