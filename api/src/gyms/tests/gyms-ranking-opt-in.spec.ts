import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { GymsService } from '../gyms.service.js';

describe('GymsService.setRankingOptIn', () => {
  const userGymsRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const googlePlaces = {};

  let service: GymsService;

  const baseEntity = {
    id: 'gym-1',
    userId: 'user-1',
    placeId: 'place-1',
    name: 'Test Gym',
    address: null,
    lat: 48.0,
    lng: 2.0,
    radiusM: 120,
    onboardingGymPending: false,
    geofenceEnabled: true,
    rankingOptIn: false,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GymsService(userGymsRepo as any, googlePlaces as any);
  });

  it('throws NotFoundException when user has no gym', async () => {
    userGymsRepo.findOne.mockResolvedValue(null);

    await expect(service.setRankingOptIn('user-1', true)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.setRankingOptIn('user-1', true)).rejects.toThrow(
      'Aucune salle enregistrée.',
    );
  });

  it('sets rankingOptIn and returns updated response', async () => {
    const entity = { ...baseEntity };
    userGymsRepo.findOne.mockResolvedValue(entity);
    userGymsRepo.save.mockImplementation((e) => Promise.resolve(e));

    const result = await service.setRankingOptIn('user-1', true);

    expect(entity.rankingOptIn).toBe(true);
    expect(userGymsRepo.save).toHaveBeenCalledWith(entity);
    expect(result.rankingOptIn).toBe(true);
    expect(result.placeId).toBe('place-1');
  });

  it('can disable ranking opt-in', async () => {
    const entity = { ...baseEntity, rankingOptIn: true };
    userGymsRepo.findOne.mockResolvedValue(entity);
    userGymsRepo.save.mockImplementation((e) => Promise.resolve(e));

    const result = await service.setRankingOptIn('user-1', false);

    expect(entity.rankingOptIn).toBe(false);
    expect(result.rankingOptIn).toBe(false);
  });
});
