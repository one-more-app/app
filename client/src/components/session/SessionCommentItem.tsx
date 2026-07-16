import { ProfileAvatarFallback } from "@/components/profile/ProfileAvatarFallback";
import { SessionCommentComposer } from "@/components/session/SessionCommentComposer";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import type { SessionComment } from "@/lib/session-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useState } from "react";

type SessionCommentItemProps = {
  comment: SessionComment;
  currentUserId: string | null;
  depth?: number;
  onReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};

function formatCommentTime(createdAt: string) {
  return new Date(createdAt).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionCommentItem({
  comment,
  currentUserId,
  depth = 0,
  onReply,
  onDelete,
}: SessionCommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const profile = {
    firstName: comment.author.firstName ?? undefined,
    lastName: comment.author.lastName ?? undefined,
    username: comment.author.username ?? undefined,
  };
  const name = getProfileDisplayName(profile, null);
  const initials = getProfileInitials(profile, null);
  const isAuthor = currentUserId === comment.author.userId;
  const canReply = depth === 0;

  return (
    <div className={cn(depth > 0 && "ml-10")}>
      <div className="flex gap-3">
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <ProfileAvatarFallback
            initials={initials}
            className="size-8 shrink-0 rounded-full text-xs"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{name}</span>
            <time
              dateTime={comment.createdAt}
              className="text-[11px] text-muted-foreground"
            >
              {" · "}
              {formatCommentTime(comment.createdAt)}
            </time>
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
          <div className="mt-1.5 flex gap-3">
            {canReply ? (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setReplyOpen((open) => !open)}
              >
                {UI.sessionCommentReply}
              </button>
            ) : null}
            {isAuthor ? (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (window.confirm(UI.sessionCommentDeleteConfirm)) {
                    void onDelete(comment.id);
                  }
                }}
              >
                {UI.sessionCommentDelete}
              </button>
            ) : null}
          </div>
          {replyOpen ? (
            <div className="mt-3">
              <SessionCommentComposer
                autoFocus
                placeholder={UI.sessionCommentReplyPlaceholder}
                onCancel={() => setReplyOpen(false)}
                onSubmit={async (body) => {
                  await onReply(comment.id, body);
                  setReplyOpen(false);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
      {comment.replies.map((reply) => (
        <div key={reply.id} className="mt-3">
          <SessionCommentItem
            comment={reply}
            currentUserId={currentUserId}
            depth={depth + 1}
            onReply={onReply}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
