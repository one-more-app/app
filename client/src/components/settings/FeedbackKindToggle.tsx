import type { FeedbackKind } from "@/lib/feedback-api";
import { hapticTab } from "@/lib/haptics";
import { profileNestedClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Bug, Lightbulb, MessageCircle, type LucideIcon } from "lucide-react";

const KIND_ITEMS: {
    id: FeedbackKind;
    label: string;
    Icon: LucideIcon;
}[] = [
        { id: "bug", label: UI.feedbackTypeBug, Icon: Bug },
        { id: "idea", label: UI.feedbackTypeIdea, Icon: Lightbulb },
        { id: "suggestion", label: UI.feedbackTypeSuggestion, Icon: MessageCircle },
    ];

type FeedbackKindToggleProps = {
    value: FeedbackKind;
    onChange: (kind: FeedbackKind) => void;
};

export function FeedbackKindToggle({ value, onChange }: FeedbackKindToggleProps) {
    return (
        <div
            className={cn(profileNestedClass, "flex gap-1 p-1")}
            role="radiogroup"
            aria-label={UI.feedbackTypeLabel}
        >
            {KIND_ITEMS.map(({ id, label, Icon }) => {
                const active = value === id;

                return (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                            if (!active) hapticTab();
                            onChange(id);
                        }}
                        className={cn(
                            "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg px-1.5 py-2.5",
                            "text-xs font-medium transition-[color,transform,background-color]",
                            "active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary",
                            active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-card/80 hover:text-foreground",
                        )}
                    >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        <span className="truncate">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
