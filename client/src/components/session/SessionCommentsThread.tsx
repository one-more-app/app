import { SessionCommentComposer } from "@/components/session/SessionCommentComposer";
import { SessionCommentItem } from "@/components/session/SessionCommentItem";
import { ReactionBubbles } from "@/components/session/ReactionBubbles";
import { Card } from "@/components/ui/card";
import {
  fetchSessionComments,
  mergeSessionComment,
  postSessionComment,
  sessionCommentsSwrKey,
  updateSessionComment,
  type ReactionBubble,
  type SessionComment,
} from "@/lib/session-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

type SessionCommentsThreadProps = {
  ownerUserId: string;
  date: string;
  currentUserId: string | null;
  reactions?: ReactionBubble[];
  onToggleReaction?: (emoji: string) => void;
  reactionsDisabled?: boolean;
};

export function SessionCommentsThread({
  ownerUserId,
  date,
  currentUserId,
  reactions = [],
  onToggleReaction,
  reactionsDisabled = false,
}: SessionCommentsThreadProps) {
  const { mutate } = useSWRConfig();
  const commentsKey = sessionCommentsSwrKey(ownerUserId, date);
  const { data, isLoading } = useSWR(commentsKey, () =>
    fetchSessionComments(ownerUserId, date),
  );

  const items = data?.items ?? [];

  const handleCreate = async (body: string, parentId?: string) => {
    try {
      const { comment } = await postSessionComment(
        ownerUserId,
        date,
        body,
        parentId,
      );
      await mutate(
        commentsKey,
        (current: { items: SessionComment[] } | undefined) => {
          const { items } = mergeSessionComment(current?.items ?? [], comment);
          return { items };
        },
        { revalidate: false },
      );
    } catch {
      toast.error(UI.sessionCommentError);
    }
  };

  const handleEdit = async (commentId: string, body: string) => {
    try {
      const { comment } = await updateSessionComment(
        ownerUserId,
        date,
        commentId,
        body,
      );
      await mutate(
        commentsKey,
        (current: { items: SessionComment[] } | undefined) => {
          const { items } = mergeSessionComment(current?.items ?? [], comment);
          return { items };
        },
        { revalidate: false },
      );
    } catch (error) {
      toast.error(UI.sessionCommentError);
      throw error;
    }
  };

  return (
    <section className="space-y-2">
      <h2 className="font-one-more text-sm font-semibold uppercase italic tracking-tight">
        {UI.sessionCommentsTitle}
      </h2>

      <Card className="gap-0 space-y-3.5 p-4">
        {onToggleReaction ? (
          <ReactionBubbles
            reactions={reactions}
            currentUserId={currentUserId}
            disabled={reactionsDisabled}
            onToggle={onToggleReaction}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{UI.loading}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {UI.sessionCommentsEmptyHint}
          </p>
        ) : (
          <ul className="space-y-3.5">
            {items.map((comment) => (
              <li key={comment.id}>
                <SessionCommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  sessionOwnerUserId={ownerUserId}
                  onReply={(parentId, body) => handleCreate(body, parentId)}
                  onEdit={handleEdit}
                />
              </li>
            ))}
          </ul>
        )}

        <SessionCommentComposer onSubmit={(body) => handleCreate(body)} />
      </Card>
    </section>
  );
}
