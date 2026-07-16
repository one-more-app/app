import { SessionCommentComposer } from "@/components/session/SessionCommentComposer";
import { SessionCommentItem } from "@/components/session/SessionCommentItem";
import {
  deleteSessionComment,
  fetchSessionComments,
  mergeSessionComment,
  postSessionComment,
  sessionCommentsSwrKey,
  type SessionComment,
} from "@/lib/session-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

type SessionCommentsThreadProps = {
  ownerUserId: string;
  date: string;
  currentUserId: string | null;
};

export function SessionCommentsThread({
  ownerUserId,
  date,
  currentUserId,
}: SessionCommentsThreadProps) {
  const { mutate } = useSWRConfig();
  const commentsKey = sessionCommentsSwrKey(ownerUserId, date);
  const { data, isLoading } = useSWR(commentsKey, () =>
    fetchSessionComments(ownerUserId, date),
  );

  const items = data?.items ?? [];

  const refreshComments = async () => {
    await mutate(commentsKey);
  };

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

  const handleDelete = async (commentId: string) => {
    try {
      await deleteSessionComment(ownerUserId, date, commentId);
      await refreshComments();
    } catch {
      toast.error(UI.sessionCommentError);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">{UI.sessionCommentsTitle}</h2>

      <SessionCommentComposer onSubmit={(body) => handleCreate(body)} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{UI.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {UI.sessionCommentsEmptyHint}
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((comment) => (
            <li key={comment.id}>
              <SessionCommentItem
                comment={comment}
                currentUserId={currentUserId}
                onReply={(parentId, body) => handleCreate(body, parentId)}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
