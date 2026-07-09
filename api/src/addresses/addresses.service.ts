import { Injectable } from '@nestjs/common';
import { GooglePlacesService } from '../places/google-places.service.js';

@Injectable()
export class AddressesService {
  constructor(private readonly googlePlaces: GooglePlacesService) {}

  async searchAddresses(params: { q?: string; lat?: number; lng?: number }) {
    const results = await this.googlePlaces.searchAddresses({
      q: params.q ?? '',
      lat: params.lat,
      lng: params.lng,
    });
    return { results };
  }

  async getAddressDetails(placeId: string) {
    const address = await this.googlePlaces.getAddressDetails(placeId);
    return { address };
  }
}
