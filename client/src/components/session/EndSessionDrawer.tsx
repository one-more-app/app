import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { formatSessionChrono } from "@/lib/format-session-chrono";
import { UI } from "@/lib/translations";

export type EndSessionStats = {
    exerciseCount: number;
    setCount: number;
    durationMs: number;
};

type EndSessionDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stats: EndSessionStats;
    /**
     * Confirmation "Terminer et voir mon récap".
     * Appelle l'API de fin de séance puis navigue vers le récap.
     */
    onConfirm: () => void | Promise<void>;
    confirmLoading?: boolean;
};

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-xl bg-card p-3">
            <p className="font-one-more text-xl font-bold italic tabular-nums">
                {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

/** Tiroir "Terminer la séance ?" (capture 61). */
export function EndSessionDrawer({
    open,
    onOpenChange,
    stats,
    onConfirm,
    confirmLoading = false,
}: EndSessionDrawerProps) {
    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            data-analytics-label="end_session_drawer"
        >
            <DrawerContent>
                <DrawerHeader className="pb-2">
                    <DrawerTitle className="font-one-more text-base font-bold uppercase italic">
                        {UI.endSessionTitle}
                    </DrawerTitle>
                    <DrawerDescription className="sr-only">
                        {UI.endSessionHint}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="space-y-4 px-4 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                        <StatCard
                            value={String(stats.exerciseCount)}
                            label={
                                stats.exerciseCount === 1
                                    ? UI.endSessionExercisesOne
                                    : UI.endSessionExercises
                            }
                        />
                        <StatCard
                            value={String(stats.setCount)}
                            label={
                                stats.setCount === 1 ? UI.endSessionSetsOne : UI.endSessionSets
                            }
                        />
                        <StatCard
                            value={formatSessionChrono(stats.durationMs)}
                            label={UI.endSessionDuration}
                        />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        {UI.endSessionHint}
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            disabled={confirmLoading}
                            onClick={() => void onConfirm()}
                            data-analytics-label="end_session_confirm"
                        >
                            {UI.endSessionConfirm}
                        </Button>
                        <Button
                            type="button"
                            className="bg-card"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            data-analytics-label="end_session_continue"
                        >
                            {UI.endSessionContinue}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
