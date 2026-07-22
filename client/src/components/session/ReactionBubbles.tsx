import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { ReactionBubble } from "@/lib/session-api";

type ReactionBubblesProps = {
  reactions: ReactionBubble[];
  onToggle: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ReactionBubbles({
  reactions,
  onToggle,
  disabled = false,
  className,
}: ReactionBubblesProps) {
  if (reactions.length === 0) return null;

  return (
    <ul
      className={cn("flex flex-wrap gap-1.5", className)}
      aria-label={UI.sessionReactionAdd}
    >
      {reactions.map((reaction) => {
        const label = reaction.reactedByMe
          ? UI.sessionReactionToggleMine.replace("{emoji}", reaction.emoji)
          : UI.sessionReactionToggleAdd.replace("{emoji}", reaction.emoji);
        return (
          <li key={reaction.emoji}>
            <button
              type="button"
              disabled={disabled}
              aria-label={label}
              aria-pressed={reaction.reactedByMe}
              onClick={() => onToggle(reaction.emoji)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                reaction.reactedByMe
                  ? "border-accent/40 bg-accent/15 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                disabled && "pointer-events-none opacity-60",
              )}
            >
              <span aria-hidden>{reaction.emoji}</span>
              <span className="font-medium tabular-nums">{reaction.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
