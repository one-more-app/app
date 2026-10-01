import { GymChangeDialog } from "@/components/settings/GymChangeDialog";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/translations";
import { LogOut, MapPin, Pencil } from "lucide-react";
import { useState } from "react";

type RankingGymPlaceBarProps = {
  placeName: string;
  placeAddress?: string | null;
  myRank?: number | null;
  total?: number | null;
  showLeaveRanking?: boolean;
  leaveBusy?: boolean;
  onLeaveRanking?: () => void;
  onGymSaved?: () => void | Promise<void>;
};

export function RankingGymPlaceBar({
  placeName,
  placeAddress,
  myRank,
  total,
  showLeaveRanking = false,
  leaveBusy = false,
  onLeaveRanking,
  onGymSaved,
}: RankingGymPlaceBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const details: string[] = [];
  if (placeAddress?.trim()) details.push(placeAddress.trim());
  if (myRank != null && total != null && total > 0) {
    details.push(
      UI.rankingFriendRank
        .replace("{rank}", String(myRank))
        .replace("{total}", String(total)),
    );
  } else if (total != null && total > 0) {
    details.push(UI.rankingGymMembers.replace("{count}", String(total)));
  }

  return (
    <>
      <div className="flex items-center gap-1 rounded-xl bg-card px-3 py-2">
        <MapPin
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1 leading-tight px-1.5">
          <p className="truncate text-sm font-medium">{placeName}</p>
          {details.length > 0 ? (
            <p className="truncate text-xs text-muted-foreground">
              {details.join(" · ")}
            </p>
          ) : null}
        </div>
        {showLeaveRanking ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
            aria-label={UI.rankingGymOptOut}
            title={UI.rankingGymOptOut}
            disabled={leaveBusy}
            onClick={onLeaveRanking}
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={UI.gymSettingsChange}
          onClick={() => setPickerOpen(true)}
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
      </div>
      <GymChangeDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        hasGym
        onSaved={async () => {
          await onGymSaved?.();
        }}
      />
    </>
  );
}
