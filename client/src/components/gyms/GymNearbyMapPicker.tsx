import { useTheme } from "@/hooks/use-theme";
import type { GymCoords } from "@/lib/gym-geolocation";
import type { GymPlace } from "@/lib/gyms-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { Dumbbell, MapPin } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type GymNearbyMapPickerProps = {
  places: GymPlace[];
  userCoords: GymCoords | null;
  selectedPlaceId: string | null;
  onSelectPlace: (place: GymPlace) => void;
  className?: string;
};

const PARIS_FALLBACK: GymCoords = { lat: 48.8566, lng: 2.3522 };

function tileUrl(isDark: boolean): string {
  return isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}

function createGymMarkerIcon(selected: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="gym-map-marker${selected ? " gym-map-marker-selected" : ""}" aria-hidden="true"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createUserMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="gym-map-user-dot" aria-hidden="true"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function FitMapBounds({
  places,
  userCoords,
}: {
  places: GymPlace[];
  userCoords: GymCoords | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: GymCoords[] = places.map((place) => ({
      lat: place.lat,
      lng: place.lng,
    }));
    if (userCoords) points.push(userCoords);

    if (points.length === 0) {
      map.setView([PARIS_FALLBACK.lat, PARIS_FALLBACK.lng], 13);
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 16 });
  }, [map, places, userCoords]);

  return null;
}

export function GymNearbyMapPicker({
  places,
  userCoords,
  selectedPlaceId,
  onSelectPlace,
  className,
}: GymNearbyMapPickerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const mapCenter = useMemo(() => {
    if (userCoords) return userCoords;
    if (places.length > 0) {
      return { lat: places[0].lat, lng: places[0].lng };
    }
    return PARIS_FALLBACK;
  }, [places, userCoords]);

  const gymIcons = useMemo(
    () =>
      new Map(
        places.map((place) => [
          place.placeId,
          createGymMarkerIcon(place.placeId === selectedPlaceId),
        ]),
      ),
    [places, selectedPlaceId],
  );

  const userIcon = useMemo(() => createUserMarkerIcon(), []);

  const hasMarkers = places.length > 0 || userCoords != null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-muted/20",
        className,
      )}
    >
      <div className="relative h-[min(52vh,320px)] min-h-[220px] w-full">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={14}
          className="gym-nearby-map h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={tileUrl(isDark)} />
          <FitMapBounds places={places} userCoords={userCoords} />
          {userCoords ? (
            <Marker
              position={[userCoords.lat, userCoords.lng]}
              icon={userIcon}
              interactive={false}
            />
          ) : null}
          {places.map((place) => (
            <Marker
              key={place.placeId}
              position={[place.lat, place.lng]}
              icon={gymIcons.get(place.placeId)!}
              eventHandlers={{
                click: () => onSelectPlace(place),
              }}
            />
          ))}
        </MapContainer>

        {!hasMarkers ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/55 px-6 text-center backdrop-blur-[1px]">
            <p className="text-sm text-muted-foreground">{UI.gymOnboardingMapEmpty}</p>
          </div>
        ) : null}

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm">
          <MapPin className="size-3 text-accent" aria-hidden />
          {UI.gymOnboardingMapLegend}
        </div>

        <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
          © OpenStreetMap · CARTO
        </div>
      </div>

      {selectedPlaceId ? (
        <div className="border-t border-border/80 bg-card/95 px-3 py-3">
          {(() => {
            const selected = places.find((place) => place.placeId === selectedPlaceId);
            if (!selected) return null;
            return (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Dumbbell className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{selected.name}</p>
                  {selected.address ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {selected.address}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <p className="border-t border-border/80 px-3 py-2.5 text-xs text-muted-foreground">
          {UI.gymOnboardingMapHint}
        </p>
      )}
    </div>
  );
}
