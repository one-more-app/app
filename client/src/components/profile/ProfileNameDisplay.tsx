import type { AuthUser } from "@/lib/auth";
import {
    getProfilePrimaryLabel,
    getProfileUsernameLabel,
    resolveProfileName,
    type ProfileNameSource,
} from "@/lib/profile-display";
import { ProBadge } from "@/components/profile/ProBadge";
import { cn } from "@/lib/utils";

type ProfileNameDisplayProps = {
    profile?: ProfileNameSource;
    authUser?: AuthUser | null;
    isPremium?: boolean;
    size?: "default" | "lg";
    align?: "left" | "center";
    className?: string;
};

export function ProfileNameDisplay({
    profile,
    authUser = null,
    isPremium = false,
    size = "default",
    align = "left",
    className,
}: ProfileNameDisplayProps) {
    const resolved = resolveProfileName(profile, authUser);
    const primary = getProfilePrimaryLabel(resolved);
    const username = getProfileUsernameLabel(resolved);
    const showProOnPrimary = isPremium && !username;

    return (
        <div
            className={cn(
                "min-w-0",
                align === "center" && "text-center",
                className,
            )}
        >
            <span
                className={cn(
                    "flex min-w-0 items-center gap-1.5",
                    align === "center" && "justify-center",
                )}
            >
                <span
                    className={cn(
                        "min-w-0 truncate text-xs font-one-more font-semibold uppercase italic tracking-tight",
                    )}
                >
                    {primary}
                </span>
                {showProOnPrimary ? <ProBadge /> : null}
            </span>
            {username ? (
                <span
                    className={cn(
                        "flex min-w-0 items-center gap-1.5",
                        align === "center" && "justify-center",
                    )}
                >
                    <span
                        className={cn(
                            "min-w-0 truncate text-sm text-muted-foreground",
                        )}
                    >
                        {username}
                    </span>
                    {isPremium ? <ProBadge /> : null}
                </span>
            ) : null}
        </div>
    );
}
