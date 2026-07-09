import { apiFetch } from "@/lib/api";

export type AddressSuggestion = {
  placeId: string;
  label: string;
};

export type AddressDetails = {
  placeId: string;
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
};

export async function searchAddresses(params: {
  q?: string;
  lat?: number;
  lng?: number;
}): Promise<AddressSuggestion[]> {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.lat != null) query.set("lat", String(params.lat));
  if (params.lng != null) query.set("lng", String(params.lng));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiFetch<{ results: AddressSuggestion[] }>(
    `/addresses/search${suffix}`,
  );
  return data.results;
}

export async function getAddressDetails(placeId: string): Promise<AddressDetails> {
  const data = await apiFetch<{ address: AddressDetails }>(
    `/addresses/${encodeURIComponent(placeId)}`,
  );
  return data.address;
}
