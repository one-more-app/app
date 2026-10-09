import { Button } from "@/components/ui/button";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { useUserGymData } from "@/hooks/use-user-gym-data";
import { hapticImpact } from "@/lib/haptics";
import {
    formatNextReminderDay,
    formatReminderClock,
    reminderSlotsFromPrefs,
    resolveNextReminder,
} from "@/lib/reminder-schedule";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const FIRST_SESSION_HERO_SRC = "/images/first-session-hero.jpg";
const EDIT_REMINDER_PATH = "/onboarding?step=first-reminder&from=home";

type ReminderState =
    | { kind: "none" }
    | { kind: "days"; day: string; time: string }
    | { kind: "gym"; gymName: string | null };

/** Carte « Ta première séance » : nouvel inscrit, avec 3 états de rappel. */
export function HomeFirstSessionCard() {
    const navigate = useNavigate();
    const { data: prefs } = useNotificationPreferences();
    const { data: userGym } = useUserGymData();

    const state = useMemo<ReminderState>(() => {
        const slots = reminderSlotsFromPrefs(prefs ?? {});
        const next = resolveNextReminder(slots);
        if (next) {
            return {
                kind: "days",
                day: formatNextReminderDay(next),
                time: formatReminderClock(next.hour, next.minute),
            };
        }
        if (userGym) return { kind: "gym", gymName: userGym.name || null };
        return { kind: "none" };
    }, [prefs, userGym]);

    const active = state.kind !== "none";

    const title =
        state.kind === "none"
            ? [UI.homeFirstSessionNoneTitle1, UI.homeFirstSessionNoneTitle2]
            : state.kind === "days"
                ? [
                    UI.homeFirstSessionDaysTitle1,
                    `${state.day} ${UI.homeFirstSessionAtTime.replace("{time}", state.time)}`,
                ]
                : [UI.homeFirstSessionGymTitle1, UI.homeFirstSessionGymTitle2];

    const body =
        state.kind === "none"
            ? UI.homeFirstSessionNoneBody
            : state.kind === "days"
                ? UI.homeFirstSessionDaysBody
                : state.gymName
                    ? UI.homeFirstSessionGymBody.replace("{gym}", state.gymName)
                    : UI.homeFirstSessionGymBodyNoName;

    return (
        <section
            aria-label={UI.homeFirstSessionTitle}
            className="dark flex flex-col overflow-hidden rounded-2xl bg-primary text-white"
        >
            <div className="relative h-[120px]">
                <img
                    src={FIRST_SESSION_HERO_SRC}
                    alt=""
                    className="absolute inset-0 size-full select-none object-cover object-[50%_35%]"
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                />
                <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-primary/15 from-20% to-primary"
                />
                <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <h2 className="font-one-more text-xs font-normal uppercase italic leading-[1.1] tracking-tight [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
                        {UI.homeFirstSessionTitle}
                    </h2>
                    <span
                        className={cn(
                            "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold",
                            active
                                ? "bg-accent text-accent-foreground"
                                : "bg-black/55 text-white",
                        )}
                    >
                        <Bell className="size-3" aria-hidden />
                        {active ? UI.homeFirstSessionTagOn : UI.homeFirstSessionTagOff}
                    </span>
                </div>
            </div>
            <div className="relative -mt-3.5 flex flex-col gap-3 px-4 pb-4">
                <p className="font-one-more text-[26px] font-bold uppercase italic leading-none">
                    {title[0]}
                    <br />
                    <span className="accent-text">{title[1]}</span>
                </p>
                <p className="text-[13px] leading-[1.45] text-white/75">{body}</p>
                {active ? (
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full gap-2"
                        data-analytics-label="home_first_session_edit_reminder"
                        onClick={() => {
                            void hapticImpact();
                            navigate(EDIT_REMINDER_PATH);
                        }}
                    >
                        <Bell className="size-4" aria-hidden />
                        {UI.homeFirstSessionEdit}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="accent"
                        className="h-10 w-full gap-2"
                        data-analytics-label="home_first_session_activate_reminder"
                        onClick={() => {
                            void hapticImpact();
                            navigate(EDIT_REMINDER_PATH);
                        }}
                    >
                        <Bell className="size-3.5" aria-hidden />
                        {UI.homeFirstSessionActivate}
                    </Button>
                )}
            </div>
        </section>
    );
}
