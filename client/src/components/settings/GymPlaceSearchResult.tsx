import { UI } from "@/lib/translations";
import type { GymPlace } from "@/lib/gyms-api";

type GymPlaceSearchResultProps = {
  place: GymPlace;
  disabled?: boolean;
  onSelect: () => void;
};

function formatDistance(distanceM: number | null): string | null {
  if (distanceM == null) return null;
  return UI.gymDistanceM.replace("{distance}", String(distanceM));
}

export function GymPlaceSearchResult({
  place,
  disabled,
  onSelect,
}: GymPlaceSearchResultProps) {
  const distance = formatDistance(place.distanceM);

  return (
    <button
      type="button"
      className="w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
      disabled={disabled}
      onClick={onSelect}
    >
      <p className="text-sm font-medium">{place.name}</p>
      {place.address ? (
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {place.address}
        </p>
      ) : (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {UI.gymSettingsSearchNoAddress}
        </p>
      )}
      {distance ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{distance}</p>
      ) : null}
    </button>
  );
}
