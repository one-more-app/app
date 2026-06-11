import type { AuthUser } from "@/lib/auth";
import {
    getProfilePrimaryLabel,
    getProfileUsernameLabel,
    resolveProfileName,
    type ProfileNameSource,
} from "@/lib/profile-display";
import { cn } from "@/lib/utils";

type ProfileNameDisplayProps = {
    profile?: ProfileNameSource;
    authUser?: AuthUser | null;
    size?: "default" | "lg";
    align?: "left" | "center";
    className?: string;
};

export function ProfileNameDisplay({
    profile,
    authUser = null,
    size = "default",
    align = "left",
    className,
}: ProfileNameDisplayProps) {
    const resolved = resolveProfileName(profile, authUser);
    const primary = getProfilePrimaryLabel(resolved);
    const username = getProfileUsernameLabel(resolved);

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
                    "block truncate text-xs font-one-more font-semibold uppercase italic tracking-tight",
                )}
            >
                {primary}
            </span>
            {username ? (
                <span
                    className={cn(
                        "block truncate text-sm text-muted-foreground",
                    )}
                >
                    {username}
                </span>
            ) : null}
        </div>
    );
}
