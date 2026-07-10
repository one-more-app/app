import { OnboardingReveal } from "@/components/onboarding/onboarding-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMutateUserGym } from "@/hooks/use-user-gym-data";
import {
  getCurrentGymCoords,
  requestGymLocationPermission,
} from "@/lib/gym-geolocation";
import {
  fetchUserGym,
  isWithinGymRadius,
  searchGyms,
  upsertUserGym,
  type GymPlace,
} from "@/lib/gyms-api";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { List, Loader2, Map, MapPin, Search } from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const GymNearbyMapPicker = lazy(async () => {
  const module = await import("@/components/gyms/GymNearbyMapPicker");
  return { default: module.GymNearbyMapPicker };
});

type GymSearchView = "list" | "map";

export type GymSearchPickerProps = {
  onGymSaved: () => void | Promise<void>;
  fromSettings?: boolean;
  animated?: boolean;
  initialSearchQuery?: string;
  initialSelectedPlaceId?: string | null;
  initialSearchView?: GymSearchView;
  showHint?: boolean;
  autoSearchNearby?: boolean;
  className?: string;
};

function formatDistance(distanceM: number | null): string {
  if (distanceM == null) return "";
  return UI.gymDistanceM.replace("{distance}", String(distanceM));
}

function Reveal({
  animated,
  delayMs,
  children,
}: {
  animated: boolean;
  delayMs?: number;
  children: ReactNode;
}) {
  if (!animated) return <>{children}</>;
  return <OnboardingReveal delayMs={delayMs}>{children}</OnboardingReveal>;
}

export function GymSearchPicker({
  onGymSaved,
  fromSettings = false,
  animated = false,
  initialSearchQuery = "",
  initialSelectedPlaceId = null,
  initialSearchView = "list",
  showHint = true,
  autoSearchNearby = true,
  className,
}: GymSearchPickerProps) {
  const mutateUserGym = useMutateUserGym();
  const isNative = Capacitor.isNativePlatform();
  const autoNearbySearchDoneRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [results, setResults] = useState<GymPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchView, setSearchView] = useState<GymSearchView>(initialSearchView);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    initialSelectedPlaceId,
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const ensureUserCoords = useCallback(async () => {
    if (userCoords) return userCoords;
    const granted = await requestGymLocationPermission();
    if (!granted) return null;
    const coords = await getCurrentGymCoords();
    setUserCoords(coords);
    return coords;
  }, [userCoords]);

  const saveGym = useCallback(
    async (place: GymPlace, coords: { lat: number; lng: number } | null) => {
      setSaving(true);
      setError(null);
      try {
        const existing = fromSettings ? await fetchUserGym().catch(() => null) : null;
        const inZone =
          coords != null
            ? isWithinGymRadius(coords.lat, coords.lng, {
                lat: place.lat,
                lng: place.lng,
                radiusM: 120,
              })
            : false;

        await upsertUserGym({
          placeId: place.placeId,
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          radiusM: 120,
          onboardingGymPending: fromSettings
            ? (existing?.onboardingGymPending ?? false)
            : !inZone,
          geofenceEnabled: existing?.geofenceEnabled ?? true,
        });

        await mutateUserGym();
        await onGymSaved();
      } catch {
        setError(UI.gymSettingsSaveError);
      } finally {
        setSaving(false);
      }
    },
    [fromSettings, mutateUserGym, onGymSaved],
  );

  const runSearch = useCallback(
    async (options?: { preferMapView?: boolean }) => {
      setSearching(true);
      setError(null);
      try {
        let coords = userCoords;
        if (!coords) {
          try {
            coords = await ensureUserCoords();
          } catch {
            coords = null;
          }
        }
        const items = await searchGyms({
          q: searchQuery.trim() || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        });
        setResults(items);
        setSelectedPlaceId((current) => {
          if (current && items.some((item) => item.placeId === current)) {
            return current;
          }
          return null;
        });
        if (items.length === 0) {
          setError(UI.gymOnboardingNoResults);
        } else if (options?.preferMapView) {
          setSearchView("map");
        }
      } catch {
        setError(UI.gymOnboardingNoResults);
        setResults([]);
        setSelectedPlaceId(null);
      } finally {
        setSearching(false);
      }
    },
    [ensureUserCoords, searchQuery, userCoords],
  );

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = window.setTimeout(() => {
      void runSearch();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery, runSearch]);

  useEffect(() => {
    if (!autoSearchNearby || autoNearbySearchDoneRef.current) return;
    if (initialSearchQuery.trim()) return;

    autoNearbySearchDoneRef.current = true;
    void runSearch({ preferMapView: true });
  }, [autoSearchNearby, initialSearchQuery, runSearch]);

  const selectedPlace =
    results.find((place) => place.placeId === selectedPlaceId) ?? null;

  if (saving) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 py-10 ${className ?? ""}`}
      >
        <Loader2 className="size-8 animate-spin text-accent" aria-hidden />
        <p className="text-sm text-muted-foreground">{UI.continue}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {showHint ? (
        <Reveal animated={animated} delayMs={80}>
          <p className="text-sm text-muted-foreground">
            {!isNative ? UI.gymOnboardingWebSearch : UI.gymOnboardingHint}
          </p>
        </Reveal>
      ) : null}

      <Reveal animated={animated} delayMs={160}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={UI.gymOnboardingSearchPlaceholder}
            className="pl-9"
          />
        </div>
      </Reveal>

      <Reveal animated={animated} delayMs={240}>
        <Button
          variant="outline"
          className="w-full"
          disabled={searching}
          onClick={() => void runSearch({ preferMapView: true })}
        >
          <MapPin className="mr-2 size-4" aria-hidden />
          {UI.gymOnboardingSearchNearby}
        </Button>
      </Reveal>

      <Reveal animated={animated} delayMs={300}>
        <ToggleGroup
          type="single"
          value={searchView}
          onValueChange={(value) => {
            if (value === "list" || value === "map") {
              setSearchView(value);
            }
          }}
          variant="outline"
          className="grid w-full grid-cols-2 rounded-xl border border-border/80 bg-muted/20 p-1"
        >
          <ToggleGroupItem
            value="list"
            aria-label={UI.gymOnboardingViewList}
            className="h-9 w-full rounded-lg data-[state=on]:shadow-none"
          >
            <List className="mr-2 size-4" aria-hidden />
            {UI.gymOnboardingViewList}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="map"
            aria-label={UI.gymOnboardingViewMap}
            className="h-9 w-full rounded-lg data-[state=on]:shadow-none"
          >
            <Map className="mr-2 size-4" aria-hidden />
            {UI.gymOnboardingViewMap}
          </ToggleGroupItem>
        </ToggleGroup>
      </Reveal>

      {error ? (
        <Reveal animated={animated} delayMs={340}>
          <p className="text-sm text-destructive">{error}</p>
        </Reveal>
      ) : null}

      {searchView === "map" ? (
        <Reveal animated={animated} delayMs={380}>
          <Suspense
            fallback={
              <div className="flex h-[220px] items-center justify-center rounded-2xl border border-border/80 bg-muted/20">
                <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
              </div>
            }
          >
            <GymNearbyMapPicker
              places={results}
              userCoords={userCoords}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={(place) => setSelectedPlaceId(place.placeId)}
            />
          </Suspense>
        </Reveal>
      ) : (
        <Reveal animated={animated} delayMs={380}>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {results.map((place, index) => {
              const isSelected = place.placeId === selectedPlaceId;
              return (
                <li key={place.placeId}>
                  <Reveal animated={animated} delayMs={420 + index * 50}>
                    <button
                      type="button"
                      aria-label={place.name}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-accent/70 bg-accent/10"
                          : "border-border/80 bg-muted/20 hover:bg-muted/40"
                      }`}
                      onClick={() => {
                        setSelectedPlaceId(place.placeId);
                        void saveGym(place, userCoords);
                      }}
                    >
                      <p className="font-medium">{place.name}</p>
                      {place.address ? (
                        <p className="text-sm text-muted-foreground">{place.address}</p>
                      ) : null}
                      {place.distanceM != null ? (
                        <p className="text-xs text-muted-foreground">
                          {formatDistance(place.distanceM)}
                        </p>
                      ) : null}
                    </button>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Reveal>
      )}

      {searchView === "map" && selectedPlace ? (
        <Reveal animated={animated} delayMs={440}>
          <Button
            variant="accent"
            className="w-full"
            onClick={() => void saveGym(selectedPlace, userCoords)}
          >
            {UI.gymOnboardingMapSelectCta}
          </Button>
        </Reveal>
      ) : null}

      {searching ? (
        <Reveal animated={animated} delayMs={480}>
          <p className="text-xs text-muted-foreground">
            {UI.gymOnboardingWaitGymSearching}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
