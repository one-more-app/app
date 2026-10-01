import { ProfileAvatarLink } from "@/components/profile/ProfileAvatarLink";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLongPress } from "@/hooks/use-long-press";
import { hapticImpact } from "@/lib/haptics";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "@/lib/profile-display";
import {
  SESSION_REACTION_EMOJIS,
  type ReactionBubble,
} from "@/lib/session-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";

type ReactionBubblesProps = {
  reactions: ReactionBubble[];
  onToggle: (emoji: string) => void;
  currentUserId?: string | null;
  disabled?: boolean;
  className?: string;
};

type ReactionEmojiButtonProps = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  disabled: boolean;
  onToggle: () => void;
  onShowPeople: () => void;
};

function ReactionEmojiButton({
  emoji,
  count,
  reactedByMe,
  disabled,
  onToggle,
  onShowPeople,
}: ReactionEmojiButtonProps) {
  const openPeople = useCallback(() => {
    if (count <= 0) return;
    void hapticImpact();
    onShowPeople();
  }, [count, onShowPeople]);

  const { handlers, didLongPressRef } = useLongPress({
    onLongPress: openPeople,
    disabled: disabled || count <= 0,
  });

  const label = reactedByMe
    ? UI.sessionReactionToggleMine.replace("{emoji}", emoji)
    : UI.sessionReactionToggleAdd.replace("{emoji}", emoji);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={reactedByMe}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onContextMenu={handlers.onContextMenu}
      onClickCapture={(event: MouseEvent) => {
        if (!didLongPressRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        didLongPressRef.current = false;
      }}
      onClick={() => onToggle()}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
        reactedByMe
          ? "border-foreground/50 bg-muted font-medium text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span aria-hidden>{emoji}</span>
      {count > 0 ? (
        <span className="font-medium tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}

export function ReactionBubbles({
  reactions,
  onToggle,
  currentUserId = null,
  disabled = false,
  className,
}: ReactionBubblesProps) {
  const byEmoji = useMemo(() => {
    const map = new Map<string, ReactionBubble>();
    for (const reaction of reactions) {
      map.set(reaction.emoji, {
        ...reaction,
        users: reaction.users ?? [],
      });
    }
    return map;
  }, [reactions]);

  const [detailEmoji, setDetailEmoji] = useState<string | null>(null);
  const detail = detailEmoji ? byEmoji.get(detailEmoji) : undefined;

  useEffect(() => {
    if (!detailEmoji) return;
    const next = byEmoji.get(detailEmoji);
    if (!next || next.count === 0) setDetailEmoji(null);
  }, [byEmoji, detailEmoji]);

  return (
    <>
      <ul
        className={cn("flex flex-wrap gap-1.5", className)}
        aria-label={UI.sessionReactionAdd}
      >
        {SESSION_REACTION_EMOJIS.map((emoji) => {
          const reaction = byEmoji.get(emoji);
          const count = reaction?.count ?? 0;
          const reactedByMe = reaction?.reactedByMe ?? false;
          return (
            <li key={emoji}>
              <ReactionEmojiButton
                emoji={emoji}
                count={count}
                reactedByMe={reactedByMe}
                disabled={disabled}
                onToggle={() => onToggle(emoji)}
                onShowPeople={() => setDetailEmoji(emoji)}
              />
            </li>
          );
        })}
      </ul>

      <Drawer
        open={detailEmoji !== null && !!detail && detail.count > 0}
        onOpenChange={(open) => {
          if (!open) setDetailEmoji(null);
        }}
        data-analytics-label="session-reaction-people"
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {UI.sessionReactionPeopleTitle.replace(
                "{emoji}",
                detailEmoji ?? "",
              )}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {UI.sessionReactionPeopleTitle.replace(
                "{emoji}",
                detailEmoji ?? "",
              )}
            </DrawerDescription>
          </DrawerHeader>

          <ul className="max-h-[50vh] space-y-3 overflow-y-auto px-4 pb-2">
            {(detail?.users ?? []).map((user) => {
              const profile = {
                firstName: user.firstName ?? undefined,
                lastName: user.lastName ?? undefined,
                username: user.username ?? undefined,
              };
              const isSelf = currentUserId === user.userId;
              const name = isSelf
                ? UI.sessionReactionYou
                : getProfileDisplayName(profile, null);
              const initials = getProfileInitials(profile, null);
              return (
                <li key={user.userId} className="flex items-center gap-3">
                  <ProfileAvatarLink
                    userId={user.userId}
                    avatarUrl={user.avatarUrl}
                    initials={initials}
                    sizeClassName="size-9"
                    textSizeClassName="text-xs"
                    linkOptions={{ isSelf }}
                  />
                  <span className="min-w-0 truncate text-sm font-medium">
                    {name}
                  </span>
                </li>
              );
            })}
            {(detail?.users.length ?? 0) === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground">
                {UI.sessionReactionPeopleEmpty}
              </li>
            ) : null}
          </ul>

          {detailEmoji ? (
            <DrawerFooter>
              <Button
                type="button"
                variant={detail?.reactedByMe ? "outline" : "default"}
                className="w-full"
                disabled={disabled}
                onClick={() => {
                  onToggle(detailEmoji);
                }}
              >
                {detail?.reactedByMe
                  ? UI.sessionReactionToggleMine.replace(
                      "{emoji}",
                      detailEmoji,
                    )
                  : UI.sessionReactionToggleAdd.replace("{emoji}", detailEmoji)}
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
