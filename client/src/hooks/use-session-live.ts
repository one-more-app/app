import { useRealtime } from "@/hooks/use-realtime";
import {
  mergeSessionComment,
  sessionCommentsSwrKey,
  sessionCommentsSwrKeyById,
  sessionSwrKey,
  sessionSwrKeyById,
  type SessionComment,
  type SessionReactionTarget,
} from "@/lib/session-api";
import { useEffect } from "react";
import { useSWRConfig } from "swr";

/** Live updates pour une séance by id (nouveau contrat). */
export function useSessionLiveById(sessionId: string | undefined) {
  const { joinSession, leaveSession } = useRealtime();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!sessionId) return;
    joinSession(sessionId);
    return () => leaveSession(sessionId);
  }, [sessionId, joinSession, leaveSession]);

  useEffect(() => {
    if (!sessionId) return;

    const onPerf = (event: Event) => {
      const detail = (
        event as CustomEvent<{ sessionId?: string; ownerUserId?: string; date?: string }>
      ).detail;
      if (detail.sessionId && detail.sessionId !== sessionId) return;
      void mutate(sessionSwrKeyById(sessionId));
    };

    const onComment = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          sessionId?: string;
          ownerUserId?: string;
          date?: string;
          comment: SessionComment;
        }>
      ).detail;
      if (detail.sessionId && detail.sessionId !== sessionId) return;
      if (!detail.sessionId && !detail.comment) return;

      let commentAdded = false;
      void mutate(
        sessionCommentsSwrKeyById(sessionId),
        (current: { items: SessionComment[] } | undefined) => {
          if (!current) return current;
          const merged = mergeSessionComment(current.items, detail.comment);
          commentAdded = merged.added;
          return { items: merged.items };
        },
        { revalidate: false },
      );
      if (commentAdded) {
        void mutate(
          sessionSwrKeyById(sessionId),
          (current) =>
            current
              ? { ...current, commentCount: current.commentCount + 1 }
              : current,
          { revalidate: false },
        );
      }
    };

    const onReaction = () => {
      void mutate(sessionSwrKeyById(sessionId));
    };

    window.addEventListener("one-more:session-perf", onPerf);
    window.addEventListener("one-more:session-comment", onComment);
    window.addEventListener("one-more:session-reaction", onReaction);
    return () => {
      window.removeEventListener("one-more:session-perf", onPerf);
      window.removeEventListener("one-more:session-comment", onComment);
      window.removeEventListener("one-more:session-reaction", onReaction);
    };
  }, [sessionId, mutate]);
}

/** @deprecated Préférer useSessionLiveById */
export function useSessionLive(
  ownerUserId: string | undefined,
  date: string | undefined,
) {
  const { joinSession, leaveSession } = useRealtime();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!ownerUserId || !date) return;
    joinSession(ownerUserId, date);
    return () => leaveSession(ownerUserId, date);
  }, [ownerUserId, date, joinSession, leaveSession]);

  useEffect(() => {
    if (!ownerUserId || !date) return;

    const onPerf = (event: Event) => {
      const detail = (
        event as CustomEvent<{ ownerUserId: string; date: string }>
      ).detail;
      if (detail.ownerUserId !== ownerUserId || detail.date !== date) return;
      void mutate(sessionSwrKey(ownerUserId, date));
    };

    const onComment = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          ownerUserId: string;
          date: string;
          comment: SessionComment;
        }>
      ).detail;
      if (detail.ownerUserId !== ownerUserId || detail.date !== date) return;

      let commentAdded = false;
      void mutate(
        sessionCommentsSwrKey(ownerUserId, date),
        (current: { items: SessionComment[] } | undefined) => {
          if (!current) return current;
          const merged = mergeSessionComment(current.items, detail.comment);
          commentAdded = merged.added;
          return { items: merged.items };
        },
        { revalidate: false },
      );
      if (commentAdded) {
        void mutate(
          sessionSwrKey(ownerUserId, date),
          (current) =>
            current
              ? { ...current, commentCount: current.commentCount + 1 }
              : current,
          { revalidate: false },
        );
      }
    };

    const onReaction = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          ownerUserId: string;
          date: string;
          target: SessionReactionTarget;
        }>
      ).detail;
      if (detail.ownerUserId !== ownerUserId || detail.date !== date) return;
      void mutate(sessionSwrKey(ownerUserId, date));
    };

    window.addEventListener("one-more:session-perf", onPerf);
    window.addEventListener("one-more:session-comment", onComment);
    window.addEventListener("one-more:session-reaction", onReaction);
    return () => {
      window.removeEventListener("one-more:session-perf", onPerf);
      window.removeEventListener("one-more:session-comment", onComment);
      window.removeEventListener("one-more:session-reaction", onReaction);
    };
  }, [ownerUserId, date, mutate]);
}
