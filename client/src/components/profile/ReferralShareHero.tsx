import { Button } from "@/components/ui/button";
import { copyInviteCode, inviteFriend } from "@/lib/invite-friend";
import { UI } from "@/lib/translations";
import { Copy, Users } from "lucide-react";
import { useState } from "react";

type ReferralShareHeroProps = {
    inviteCode: string | null;
    referralCount: number;
};

export function ReferralShareHero({
    inviteCode,
    referralCount,
}: ReferralShareHeroProps) {
    const [busy, setBusy] = useState(false);

    const handleShare = () => {
        void (async () => {
            setBusy(true);
            try {
                await inviteFriend();
            } finally {
                setBusy(false);
            }
        })();
    };

    const handleCopy = () => {
        void (async () => {
            setBusy(true);
            try {
                await copyInviteCode();
            } finally {
                setBusy(false);
            }
        })();
    };

    const countLabel =
        referralCount === 0
            ? UI.referralCountZero
            : referralCount === 1
                ? UI.referralCountOne
                : UI.referralCountMany.replace("{count}", String(referralCount));

    return (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            {inviteCode ? (
                <button
                    type="button"
                    onClick={() => void handleCopy()}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-md bg-background px-3 py-3 text-left transition-colors hover:bg-muted/50"
                >
                    <span className="text-xs text-muted-foreground">
                        {UI.referralYourCodeLabel}
                    </span>
                    <span className="font-mono font-one-more uppercase italic text-sm tracking-widest">
                        {inviteCode}
                    </span>
                </button>
            ) : null}

            <div className="flex gap-2">
                <Button
                    className="flex-1"
                    disabled={busy || !inviteCode}
                    onClick={handleShare}
                >
                    <Users className="mr-2 size-4" />
                    {UI.profileInviteButton}
                </Button>
                <Button
                    variant="outline"
                    disabled={busy || !inviteCode}
                    onClick={handleCopy}
                    aria-label={UI.profileCopyInviteCode}
                >
                    <Copy className="size-4" />
                </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">{countLabel}</p>
        </div>
    );
}
