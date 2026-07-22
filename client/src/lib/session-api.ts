import { apiFetch } from "@/lib/api";
import type { TrackedExerciseWithPerformance } from "@/lib/data-api";
import type { PerformanceEntryWithLeagueInsight } from "@/lib/data-api";

export const SESSION_REACTION_EMOJIS = [
  "🔥",
  "💪",
  "👏",
  "😮",
  "❤️",
] as const;

export type SessionReactionEmoji = (typeof SESSION_REACTION_EMOJIS)[number];

export type SessionReactionTargetType = "session" | "exercise";

export type ReactionBubble = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type SessionReactionTarget = {
  targetType: SessionReactionTargetType;
  trackedExerciseId: string | null;
  reactions: ReactionBubble[];
};

export type SessionOwner = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type SessionHighlight = {
  entryId: string;
  type: "pr";
};

export type WorkoutSession = {
  owner: SessionOwner;
  date: string;
  isLive: boolean;
  exercises: TrackedExerciseWithPerformance[];
  entries: PerformanceEntryWithLeagueInsight[];
  highlights: SessionHighlight[];
  commentCount: number;
  exerciseCount: number;
  setCount: number;
  reactions: ReactionBubble[];
  reactionsByExerciseId: Record<string, ReactionBubble[]>;
};

export type SessionCommentAuthor = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type SessionComment = {
  id: string;
  author: SessionCommentAuthor;
  body: string;
  createdAt: string;
  parentId: string | null;
  replies: SessionComment[];
};

export function mergeSessionComment(
  items: SessionComment[],
  incoming: SessionComment,
): { items: SessionComment[]; added: boolean } {
  if (items.some((item) => item.id === incoming.id)) {
    return { items, added: false };
  }

  if (!incoming.parentId) {
    return {
      items: [...items, { ...incoming, replies: incoming.replies ?? [] }],
      added: true,
    };
  }

  let added = false;
  const nextItems = items.map((root) => {
    if (root.id !== incoming.parentId) return root;
    if (root.replies.some((reply) => reply.id === incoming.id)) return root;
    added = true;
    return {
      ...root,
      replies: [...root.replies, { ...incoming, replies: [] }],
    };
  });

  return { items: nextItems, added };
}

export function applySessionReactionTarget(
  session: WorkoutSession,
  target: SessionReactionTarget,
): WorkoutSession {
  if (target.targetType === "session") {
    return { ...session, reactions: target.reactions };
  }
  if (!target.trackedExerciseId) return session;
  return {
    ...session,
    reactionsByExerciseId: {
      ...session.reactionsByExerciseId,
      [target.trackedExerciseId]: target.reactions,
    },
  };
}

export function sessionSwrKey(ownerUserId: string, date: string) {
  return ["session", ownerUserId, date] as const;
}

export function sessionCommentsSwrKey(ownerUserId: string, date: string) {
  return ["session-comments", ownerUserId, date] as const;
}

export async function fetchSession(
  ownerUserId: string,
  date: string,
): Promise<WorkoutSession> {
  return await apiFetch<WorkoutSession>(
    `/sessions/${ownerUserId}/${encodeURIComponent(date)}`,
  );
}

export async function fetchSessionComments(
  ownerUserId: string,
  date: string,
): Promise<{ items: SessionComment[] }> {
  return await apiFetch<{ items: SessionComment[] }>(
    `/sessions/${ownerUserId}/${encodeURIComponent(date)}/comments`,
  );
}

export async function postSessionComment(
  ownerUserId: string,
  date: string,
  body: string,
  parentId?: string,
): Promise<{ comment: SessionComment }> {
  return await apiFetch(`/sessions/${ownerUserId}/${encodeURIComponent(date)}/comments`, {
    method: "POST",
    body: JSON.stringify({ body, parentId }),
  });
}

export async function deleteSessionComment(
  ownerUserId: string,
  date: string,
  commentId: string,
): Promise<{ ok: boolean }> {
  return await apiFetch(
    `/sessions/${ownerUserId}/${encodeURIComponent(date)}/comments/${commentId}`,
    { method: "DELETE" },
  );
}

export async function toggleSessionReaction(
  ownerUserId: string,
  date: string,
  payload: {
    emoji: string;
    targetType: SessionReactionTargetType;
    trackedExerciseId?: string;
  },
): Promise<{ target: SessionReactionTarget; added: boolean }> {
  const body: {
    emoji: string;
    targetType: SessionReactionTargetType;
    trackedExerciseId?: string;
  } = {
    emoji: payload.emoji,
    targetType: payload.targetType,
  };
  if (payload.targetType === "exercise" && payload.trackedExerciseId) {
    body.trackedExerciseId = payload.trackedExerciseId;
  }
  return await apiFetch(
    `/sessions/${ownerUserId}/${encodeURIComponent(date)}/reactions`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
