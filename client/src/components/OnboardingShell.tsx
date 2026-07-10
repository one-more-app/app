import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Poster noir 1×1 : évite l’icône play native Android avant le premier frame. */
const ONBOARDING_VIDEO_POSTER =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function OnboardingShell({ children }: { children: ReactNode }) {
    const [videoVisible, setVideoVisible] = useState(false);

    return (
        <div className="dark fixed inset-0 overflow-hidden bg-black text-foreground">
            <video
                className={cn(
                    "onboarding-bg-video pointer-events-none absolute inset-0 h-full w-full bg-black object-cover transition-opacity duration-500",
                    videoVisible ? "opacity-100" : "opacity-0",
                )}
                src="/onboarding-bg.mp4"
                poster={ONBOARDING_VIDEO_POSTER}
                muted
                autoPlay
                loop
                playsInline
                preload="auto"
                controls={false}
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                aria-hidden
                onPlaying={() => setVideoVisible(true)}
            />
            <div className="pointer-events-none absolute inset-0 bg-black/50" />
            <div className="pointer-events-none absolute -top-20 -left-20 size-64 animate-pulse rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-8 -right-20 size-72 animate-pulse rounded-full bg-primary/20 blur-3xl [animation-delay:700ms]" />
            <div className="relative z-10 flex min-h-dvh flex-col safe-padding">
                {children}
            </div>
        </div>
    );
}
