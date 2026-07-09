import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  deleteUserGym,
  fetchUserGym,
  searchGyms,
  upsertUserGym,
  type GymPlace,
  type UserGym,
} from "@/lib/gyms-api";
import {
  registerGymGeofence,
  unregisterGymGeofence,
} from "@/lib/gym-geofence";
import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Loader2, MapPin, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function GymSettingsCard() {
  const [gym, setGym] = useState<UserGym | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GymPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const loadGym = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserGym();
      setGym(data);
    } catch {
      setGym(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGym();
  }, [loadGym]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (isNative) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location === "granted") {
          const pos = await Geolocation.getCurrentPosition();
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      }
      const items = await searchGyms({
        q: searchQuery.trim() || undefined,
        lat,
        lng,
      });
      setResults(items);
    } catch {
      setResults([]);
      toast.error(UI.gymOnboardingNoResults);
    } finally {
      setSearching(false);
    }
  }, [isNative, searchQuery]);

  useEffect(() => {
    if (!editing || !searchQuery.trim()) return;
    const timer = window.setTimeout(() => {
      void runSearch();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [editing, searchQuery, runSearch]);

  const handleSelectGym = async (place: GymPlace) => {
    try {
      const saved = await upsertUserGym({
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        radiusM: 120,
        geofenceEnabled: gym?.geofenceEnabled ?? true,
        onboardingGymPending: gym?.onboardingGymPending ?? false,
      });
      setGym(saved);
      setEditing(false);
      if (isNative && saved.geofenceEnabled) {
        await registerGymGeofence({
          lat: saved.lat,
          lng: saved.lng,
          radiusM: saved.radiusM,
          gymName: saved.name,
          onboardingGymPending: saved.onboardingGymPending,
        });
      }
      toast.success(UI.gymSettingsSaved);
    } catch {
      toast.error("Impossible d'enregistrer la salle.");
    }
  };

  const handleToggleGeofence = async (enabled: boolean) => {
    if (!gym) return;
    try {
      const saved = await upsertUserGym({
        ...gym,
        geofenceEnabled: enabled,
      });
      setGym(saved);
      if (isNative) {
        if (enabled) {
          await registerGymGeofence({
            lat: saved.lat,
            lng: saved.lng,
            radiusM: saved.radiusM,
            gymName: saved.name,
            onboardingGymPending: saved.onboardingGymPending,
          });
        } else {
          await unregisterGymGeofence();
        }
      }
    } catch {
      toast.error("Impossible de mettre à jour le rappel.");
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(UI.gymSettingsRemoveConfirm)) return;
    try {
      await deleteUserGym();
      if (isNative) await unregisterGymGeofence();
      setGym(null);
      toast.success(UI.gymSettingsRemoved);
    } catch {
      toast.error("Impossible de retirer la salle.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{UI.gymSettingsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="gym-settings">
      <CardHeader>
        <CardTitle>{UI.gymSettingsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!gym && !editing ? (
          <p className="text-sm text-muted-foreground">{UI.gymSettingsEmpty}</p>
        ) : null}

        {gym && !editing ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 px-3 py-3">
              <p className="font-medium">{gym.name}</p>
              {gym.address ? (
                <p className="text-sm text-muted-foreground">{gym.address}</p>
              ) : null}
            </div>
            {isNative ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-3">
                <Label htmlFor="gym-geofence-toggle" className="text-sm font-normal">
                  {UI.gymSettingsGeofenceToggle}
                </Label>
                <Switch
                  id="gym-geofence-toggle"
                  checked={gym.geofenceEnabled}
                  onCheckedChange={(v) => void handleToggleGeofence(v)}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {editing ? (
          <div className="space-y-3">
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
            <Button
              variant="outline"
              className="w-full"
              disabled={searching}
              onClick={() => void runSearch()}
            >
              <MapPin className="mr-2 size-4" aria-hidden />
              {UI.gymOnboardingSearchNearby}
            </Button>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {results.map((place) => (
                <li key={place.placeId}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-2 text-left text-sm hover:bg-muted/40"
                    onClick={() => void handleSelectGym(place)}
                  >
                    {place.name}
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="w-full" onClick={() => setEditing(false)}>
              {UI.back}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
              {gym ? UI.gymSettingsChange : UI.gymSettingsTitle}
            </Button>
            {gym ? (
              <Button variant="destructive" className="flex-1" onClick={() => void handleRemove()}>
                {UI.gymSettingsRemove}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
