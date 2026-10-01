import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UI } from "@/lib/translations";
import { Dumbbell, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

type RankingGymGateProps =
    | { variant: "no-gym" }
    | {
          variant: "opt-in";
          placeName?: string | null;
          busy: boolean;
          onOptIn: () => void;
      };

export function RankingGymGate(props: RankingGymGateProps) {
    if (props.variant === "no-gym") {
        return (
            <EmptyState
                icon={MapPin}
                title={UI.rankingGymNoGymTitle}
                description={UI.rankingGymNoGymDescription}
            >
                <Button className="w-full" asChild>
                    <Link to="/settings#gym-settings">
                        {UI.rankingGymNoGymCta}
                    </Link>
                </Button>
            </EmptyState>
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
