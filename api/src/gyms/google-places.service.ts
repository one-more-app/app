import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type GymPlaceResult = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distanceM: number | null;
};

type GooglePlaceLocation = { lat: number; lng: number };

type GooglePlaceItem = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  vicinity?: string;
  geometry?: { location?: GooglePlaceLocation };
};

type GooglePlacesResponse = {
  status: string;
  results?: GooglePlaceItem[];
  error_message?: string;
};

type GoogleGeocodeResponse = {
  status: string;
  results?: Array<{
    place_id?: string;
    formatted_address?: string;
    geometry?: { location?: GooglePlaceLocation };
    types?: string[];
  }>;
  error_message?: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly cache = new Map<string, { expiresAt: number; value: GymPlaceResult }>();

  constructor(private readonly config: ConfigService) {}

  private getApiKey(): string | null {
    const raw = this.config.get<string>('GOOGLE_PLACES_API_KEY');
    if (!raw || raw.trim().length === 0) return null;
    return raw.trim();
  }

  private ensureApiKey(): string {
    const key = this.getApiKey();
    if (!key) {
      throw new ServiceUnavailableException(
        'La recherche de salles est temporairement indisponible.',
      );
    }
    return key;
  }

  private haversineM(
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

  private mapPlace(
    item: GooglePlaceItem,
    origin?: { lat: number; lng: number },
  ): GymPlaceResult | null {
    const placeId = item.place_id;
    const name = item.name;
    const lat = item.geometry?.location?.lat;
    const lng = item.geometry?.location?.lng;
    if (!placeId || !name || lat == null || lng == null) return null;
    return {
      placeId,
      name,
      address: item.formatted_address ?? item.vicinity ?? null,
      lat,
      lng,
      distanceM: origin ? Math.round(this.haversineM(origin.lat, origin.lng, lat, lng)) : null,
    };
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      this.logger.warn(`Google Places HTTP ${response.status}`);
      throw new ServiceUnavailableException(
        'La recherche de salles est temporairement indisponible.',
      );
    }
    return (await response.json()) as T;
  }

  async searchGyms(params: {
    q?: string;
    lat?: number;
    lng?: number;
  }): Promise<GymPlaceResult[]> {
    const apiKey = this.ensureApiKey();
    const origin =
      params.lat != null && params.lng != null
        ? { lat: params.lat, lng: params.lng }
        : undefined;

    let url: string;
    if (params.q && params.q.trim().length > 0) {
      const query = encodeURIComponent(`${params.q.trim()} gym`);
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&type=gym&key=${apiKey}`;
      if (origin) {
        url += `&location=${origin.lat},${origin.lng}&radius=10000`;
      }
    } else if (origin) {
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin.lat},${origin.lng}&radius=5000&type=gym&key=${apiKey}`;
    } else {
      return [];
    }

    const data = await this.fetchJson<GooglePlacesResponse>(url);
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      this.logger.warn(`Google Places status: ${data.status} ${data.error_message ?? ''}`);
      throw new ServiceUnavailableException(
        'La recherche de salles est temporairement indisponible.',
      );
    }

    const results = (data.results ?? [])
      .map((item) => this.mapPlace(item, origin))
      .filter((item): item is GymPlaceResult => item != null);

    return results.sort((a, b) => {
      if (a.distanceM == null || b.distanceM == null) return 0;
      return a.distanceM - b.distanceM;
    });
  }

  async getPlaceDetails(placeId: string): Promise<GymPlaceResult> {
    const cached = this.cache.get(placeId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const apiKey = this.ensureApiKey();
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=place_id,name,formatted_address,geometry&key=${apiKey}`;
    const data = await this.fetchJson<{
      status: string;
      result?: GooglePlaceItem;
      error_message?: string;
    }>(url);

    if (data.status !== 'OK' || !data.result) {
      throw new ServiceUnavailableException(
        'Impossible de charger les détails de cette salle.',
      );
    }

    const mapped = this.mapPlace(data.result);
    if (!mapped) {
      throw new ServiceUnavailableException(
        'Impossible de charger les détails de cette salle.',
      );
    }

    this.cache.set(placeId, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value: mapped,
    });
    return mapped;
  }

  async findNearestGymFromLocation(
    lat: number,
    lng: number,
  ): Promise<GymPlaceResult | null> {
    const nearby = await this.searchGyms({ lat, lng });
    if (nearby.length > 0) {
      return nearby[0] ?? null;
    }

    const apiKey = this.ensureApiKey();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const data = await this.fetchJson<GoogleGeocodeResponse>(url);
    if (data.status !== 'OK' || !data.results?.length) {
      return null;
    }

    const gymLike = data.results.find((r) =>
      (r.types ?? []).some((t) =>
        ['gym', 'health', 'establishment', 'point_of_interest'].includes(t),
      ),
    );
    const best = gymLike ?? data.results[0];
    const placeId = best?.place_id;
    const address = best?.formatted_address ?? null;
    const glat = best?.geometry?.location?.lat;
    const glng = best?.geometry?.location?.lng;
    if (!placeId || glat == null || glng == null) return null;

    return {
      placeId,
      name: address?.split(',')[0]?.trim() ?? 'Salle de sport',
      address,
      lat: glat,
      lng: glng,
      distanceM: Math.round(this.haversineM(lat, lng, glat, glng)),
    };
  }
}
