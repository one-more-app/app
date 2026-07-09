import { apiFetch } from "@/lib/api";

export type GymPlace = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distanceM: number | null;
};

export type UserGym = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  radiusM: number;
  onboardingGymPending: boolean;
  geofenceEnabled: boolean;
  updatedAt: string;
};

export async function searchGyms(params: {
  q?: string;
  lat?: number;
  lng?: number;
}): Promise<GymPlace[]> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.lat != null) query.set("lat", String(params.lat));
  if (params.lng != null) query.set("lng", String(params.lng));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiFetch<{ results: GymPlace[] }>(`/gyms/search${suffix}`);
  return data.results;
}

export async function getGymPlaceDetails(placeId: string): Promise<GymPlace> {
  const data = await apiFetch<{ place: GymPlace }>(
    `/gyms/places/${encodeURIComponent(placeId)}`,
  );
  return data.place;
}

export async function fetchUserGym(): Promise<UserGym | null> {
  const data = await apiFetch<{ gym: UserGym | null }>("/gyms/me");
  return data.gym;
}

export async function upsertUserGym(body: {
  placeId: string;
  name: string;
  address?: string | null;
  lat: number;
  lng: number;
  radiusM?: number;
  onboardingGymPending?: boolean;
  geofenceEnabled?: boolean;
}): Promise<UserGym> {
  const data = await apiFetch<{ gym: UserGym }>("/gyms/me", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return data.gym;
}

export async function deleteUserGym(): Promise<void> {
  await apiFetch("/gyms/me", { method: "DELETE" });
}

export async function findGymFromLocation(
  lat: number,
  lng: number,
): Promise<GymPlace | null> {
  const data = await apiFetch<{ candidate: GymPlace | null }>(
    "/gyms/me/from-location",
    {
      method: "POST",
      body: JSON.stringify({ lat, lng }),
    },
  );
  return data.candidate;
}

export async function clearOnboardingGymPendingApi(): Promise<void> {
  await apiFetch("/gyms/me/clear-onboarding-pending", { method: "POST" });
}

export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

export function isWithinGymRadius(
  userLat: number,
  userLng: number,
  gym: Pick<UserGym, "lat" | "lng" | "radiusM">,
): boolean {
  return haversineDistanceM(userLat, userLng, gym.lat, gym.lng) <= gym.radiusM;
}
