import logoText from "@/assets/logo-text.png";
import { eventCardEntrance } from "@/components/event/event-motion";
import { OnboardingReveal } from "@/components/onboarding/onboarding-motion";
import { Card } from "@/components/ui/card";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

const EVENT_APP_DOWNLOAD_QR_SRC = "/images/event/app-download-qr.png";
const EVENT_APP_STORE_BADGE_SRC = "/images/event/app-store-badge-fr.png";
const EVENT_GOOGLE_PLAY_BADGE_SRC = "/images/event/google-play-badge-fr.png";
const EVENT_MARCUS_IMAGE_SRC = "/images/marcus.png";

export function EventAppDownloadEncart({ className }: { className?: string }) {
    return (
        <OnboardingReveal delayMs={320} className="flex h-full min-h-0 shrink-0">
            <Card
                className={eventCardEntrance(
                    cn(
                        "relative flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-border/60 bg-card p-0 md:w-48 lg:w-52 xl:w-56",
                        className,
                    ),
                )}
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white from-0% via-white via-28% via-accent/25 via-45% to-accent to-100%"
                />

                <div className="relative flex min-h-0 flex-1 flex-col">
                    <div className="relative h-[82%] min-h-0 shrink-0">
                        <img
                            src={EVENT_MARCUS_IMAGE_SRC}
                            alt=""
                            className="absolute inset-0 size-full select-none object-cover object-[50%_10%]"
                            draggable={false}
                        />
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent"
                        />
                    </div>

                    <h2 className="relative z-10 -mt-6 shrink-0 px-3 pb-2 text-center font-one-more text-xl uppercase italic leading-none tracking-wide text-primary">
                        {UI.paywallTitle}
                    </h2>
                </div>

                <div className="relative z-10 flex shrink-0 flex-col gap-4 px-5 pb-4 text-center text-accent-foreground">


                    <p className="shrink-0 font-one-more uppercase italic leading-tight tracking-wide text-sm">
                        {UI.eventStandDownloadTaglineLead}
                        <br />
                        {UI.eventStandDownloadTaglineCta}
                    </p>

                    <img
                        src={EVENT_APP_DOWNLOAD_QR_SRC}
                        alt={UI.eventStandDownloadQrAlt}
                        className="mx-auto aspect-square w-full shrink-0 rounded-lg bg-white p-1 shadow-sm"
                    />

                    <div className="flex w-full shrink-0 flex-col items-center gap-2">
                        <img
                            src={EVENT_APP_STORE_BADGE_SRC}
                            alt={UI.eventStandDownloadIosAlt}
                            className="h-9 w-auto max-w-full"
                            draggable={false}
                        />
                        <img
                            src={EVENT_GOOGLE_PLAY_BADGE_SRC}
                            alt={UI.eventStandDownloadAndroidAlt}
                            className="h-9 w-auto max-w-full"
                            draggable={false}
                        />
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <img
                            src={logoText}
                            alt="One More"
                            className="mx-auto h-11 w-auto shrink-0 brightness-0"
                            draggable={false}
                        />
                    </div>
                </div>
            </Card>
        </OnboardingReveal>
    );
}
