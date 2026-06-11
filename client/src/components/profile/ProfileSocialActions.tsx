import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { resolveInviteShareUrl } from "@/lib/invite-link";
import { fetchInviteLink, shareInviteUrl } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileSocialActions() {
    const auth = useAuth();
    const [busy, setBusy] = useState<"share" | "invite" | null>(null);

    const handleInvite = () => {
        void (async () => {
            setBusy("invite");
            try {
                const link = await fetchInviteLink();
                const shareUrl = await resolveInviteShareUrl(
                    link,
                    auth.user?.id,
                );
                const result = await shareInviteUrl(shareUrl);
                if (result === "dismissed") return;
                toast.success(
                    result === "copied" ? UI.inviteLinkCopied : UI.inviteLinkShared,
                );
            } catch {
                toast.error(UI.inviteShareError);
            } finally {
                setBusy(null);
            }
        })();
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Button
                    className="flex-1"
                    disabled={busy !== null}
                    onClick={handleInvite}
                >
                    <Users className="mr-2 size-4" />
                    {UI.profileInviteButton}
                </Button>
            </div>
        </div>
    );
}
