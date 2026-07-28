import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UI } from "@/lib/translations";
import { useState } from "react";

type SessionCommentComposerProps = {
    onSubmit: (body: string) => Promise<void>;
    placeholder?: string;
    submitLabel?: string;
    autoFocus?: boolean;
    initialValue?: string;
    onCancel?: () => void;
};

export function SessionCommentComposer({
    onSubmit,
    placeholder = UI.sessionCommentPlaceholder,
    submitLabel = UI.sessionCommentSend,
    autoFocus = false,
    initialValue = "",
    onCancel,
}: SessionCommentComposerProps) {
    const [draft, setDraft] = useState(initialValue);
    const [sending, setSending] = useState(false);

    const handleSubmit = () => {
        const body = draft.trim();
        if (!body || sending) return;
        void (async () => {
            setSending(true);
            try {
                await onSubmit(body);
                setDraft("");
                onCancel?.();
            } finally {
                setSending(false);
            }
        })();
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={draft}
                    className="bg-card"
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={placeholder}
                    maxLength={500}
                    autoFocus={autoFocus}
                    enterKeyHint="send"
                    autoComplete="off"
                    onFocus={(event) => {
                        // iOS KeyboardResize.None : ramener le champ au-dessus du clavier.
                        event.currentTarget.scrollIntoView({
                            block: "nearest",
                            behavior: "smooth",
                        });
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sending || !draft.trim()}
                >
                    {submitLabel}
                </Button>
            </div>
            {onCancel ? (
                <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={onCancel}
                    disabled={sending}
                >
                    {UI.cancel}
                </button>
            ) : null}
        </div>
    );
}
