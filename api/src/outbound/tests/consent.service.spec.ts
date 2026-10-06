import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';
import { NotificationPreferencesService } from '../../notifications/notification-preferences.service.js';
import { ConsentService } from '../consent/consent.service.js';
import { EmailSuppressionEntity } from '../entities/email-suppression.entity.js';

describe('ConsentService', () => {
  let service: ConsentService;
  const usersRepo = {
    findOne: jest.fn(),
  };
  const suppressionsRepo = {
    findOne: jest.fn(),
    upsert: jest.fn(),
  };
  const notificationPrefs = {
    getOrCreate: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: getRepositoryToken(UserEntity), useValue: usersRepo },
        {
          provide: getRepositoryToken(EmailSuppressionEntity),
          useValue: suppressionsRepo,
        },
        {
          provide: NotificationPreferencesService,
          useValue: notificationPrefs,
        },
      ],
    }).compile();
    service = module.get(ConsentService);
  });

  it('isEmailMarketingAllowed returns false when marketingEmail is off', async () => {
    notificationPrefs.getOrCreate.mockResolvedValue({ marketingEmail: false });
    usersRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      deletedAt: null,
    });
    await expect(service.isEmailMarketingAllowed('u1')).resolves.toBe(false);
  });

  it('isEmailMarketingAllowed returns false when email is suppressed', async () => {
    notificationPrefs.getOrCreate.mockResolvedValue({ marketingEmail: true });
    usersRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      deletedAt: null,
    });
    suppressionsRepo.findOne.mockResolvedValue({ email: 'a@b.com' });
    await expect(service.isEmailMarketingAllowed('u1')).resolves.toBe(false);
  });

  it('isEmailMarketingAllowed returns true when allowed', async () => {
    notificationPrefs.getOrCreate.mockResolvedValue({ marketingEmail: true });
    usersRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      deletedAt: null,
    });
    suppressionsRepo.findOne.mockResolvedValue(null);
    await expect(service.isEmailMarketingAllowed('u1')).resolves.toBe(true);
  });
});
