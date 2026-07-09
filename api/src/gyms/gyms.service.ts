import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertUserGymDto } from './dto/upsert-user-gym.dto.js';
import { UserGymEntity } from './entities/user-gym.entity.js';
import { GooglePlacesService } from './google-places.service.js';

export type UserGymResponse = {
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

@Injectable()
export class GymsService {
  constructor(
    @InjectRepository(UserGymEntity)
    private readonly userGyms: Repository<UserGymEntity>,
    private readonly googlePlaces: GooglePlacesService,
  ) {}

  private toResponse(entity: UserGymEntity): UserGymResponse {
    return {
      placeId: entity.placeId,
      name: entity.name,
      address: entity.address,
      lat: entity.lat,
      lng: entity.lng,
      radiusM: entity.radiusM,
      onboardingGymPending: entity.onboardingGymPending,
      geofenceEnabled: entity.geofenceEnabled,
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  async searchGyms(params: { q?: string; lat?: number; lng?: number }) {
    const results = await this.googlePlaces.searchGyms(params);
    return { results };
  }

  async getPlaceDetails(placeId: string) {
    const place = await this.googlePlaces.getPlaceDetails(placeId);
    return { place };
  }

  async getUserGym(userId: string): Promise<UserGymResponse | null> {
    const entity = await this.userGyms.findOne({ where: { userId } });
    if (!entity) return null;
    return this.toResponse(entity);
  }

  async upsertUserGym(userId: string, body: UpsertUserGymDto): Promise<UserGymResponse> {
    let entity = await this.userGyms.findOne({ where: { userId } });
    if (!entity) {
      entity = this.userGyms.create({ userId });
    }

    entity.placeId = body.placeId;
    entity.name = body.name;
    entity.address = body.address ?? null;
    entity.lat = body.lat;
    entity.lng = body.lng;
    entity.radiusM = body.radiusM ?? 120;
    if (body.onboardingGymPending !== undefined) {
      entity.onboardingGymPending = body.onboardingGymPending;
    }
    if (body.geofenceEnabled !== undefined) {
      entity.geofenceEnabled = body.geofenceEnabled;
    }

    const saved = await this.userGyms.save(entity);
    return this.toResponse(saved);
  }

  async deleteUserGym(userId: string): Promise<{ ok: true }> {
    const entity = await this.userGyms.findOne({ where: { userId } });
    if (!entity) {
      throw new NotFoundException('Aucune salle enregistrée.');
    }
    await this.userGyms.remove(entity);
    return { ok: true };
  }

  async fromLocation(userId: string, lat: number, lng: number) {
    const candidate = await this.googlePlaces.findNearestGymFromLocation(lat, lng);
    return { candidate };
  }

  async clearOnboardingGymPending(userId: string): Promise<void> {
    const entity = await this.userGyms.findOne({ where: { userId } });
    if (!entity || !entity.onboardingGymPending) return;
    entity.onboardingGymPending = false;
    await this.userGyms.save(entity);
  }
}
