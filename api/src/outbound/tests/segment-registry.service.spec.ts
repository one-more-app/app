import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';
import { SegmentRegistryService } from '../segments/segment-registry.service.js';

describe('SegmentRegistryService', () => {
  it('rejects unknown segment keys', async () => {
    const module = await Test.createTestingModule({
      providers: [
        SegmentRegistryService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();
    const registry = module.get(SegmentRegistryService);
    await expect(
      registry.resolveUserIds('unknown_segment', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
