import { GymChangeDialog } from "@/components/settings/GymChangeDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UI } from "@/lib/translations";
import { Dumbbell, MapPin } from "lucide-react";
import { useState } from "react";

type RankingGymGateProps =
    | {
          variant: "no-gym";
          onGymSaved?: () => void | Promise<void>;
      }
    | {
          variant: "opt-in";
          placeName?: string | null;
          busy: boolean;
          onOptIn: () => void;
      };

export function RankingGymGate(props: RankingGymGateProps) {
    const [pickerOpen, setPickerOpen] = useState(false);

    if (props.variant === "no-gym") {
        return (
            <>
                <EmptyState
                    icon={MapPin}
                    title={UI.rankingGymNoGymTitle}
                    description={UI.rankingGymNoGymDescription}
                >
                    <Button
                        className="w-full"
                        onClick={() => setPickerOpen(true)}
                    >
                        {UI.rankingGymNoGymCta}
                    </Button>
                </EmptyState>
                <GymChangeDialog
                    open={pickerOpen}
                    onOpenChange={setPickerOpen}
                    hasGym={false}
                    onSaved={async () => {
                        await props.onGymSaved?.();
                    }}
                />
            </>
        );
    }

    return (
        <EmptyState
            icon={Dumbbell}
            title={UI.rankingGymOptInTitle}
            description={UI.rankingGymOptInDescription.replace(
                "{place}",
                props.placeName?.trim() || UI.rankingTabGym.toLowerCase(),
            )}
        >
            <Button
                className="w-full"
                disabled={props.busy}
                onClick={props.onOptIn}
            >
                {UI.rankingGymOptInCta}
            </Button>
        </EmptyState>
    );
}
