import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MarketingMessageVarsService } from '../../outbound/lib/marketing-message-vars.service.js';

describe('MarketingMessageVarsService D+1 eligibility', () => {
  const perfRepo = {
    createQueryBuilder: jest.fn(),
  };
  const progressRepo = { findOne: jest.fn() };
  const xpRepo = { createQueryBuilder: jest.fn() };

  let service: MarketingMessageVarsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MarketingMessageVarsService(
      progressRepo as never,
      perfRepo as never,
      xpRepo as never,
    );
  });

  function mockPerfCount(count: number) {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(() => Promise.resolve(count)),
    };
    perfRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  it('trainingReminderEligible returns null when user already logged today', async () => {
    mockPerfCount(1);
    await expect(
      service.trainingReminderEligible('u1', 'UTC'),
    ).resolves.toBeNull();
  });

  it('trainingReminderEligible returns vars when no perf today', async () => {
    mockPerfCount(0);
    const vars = await service.trainingReminderEligible('u1', 'UTC');
    expect(vars).toEqual(
      expect.objectContaining({ today: expect.any(String) }),
    );
  });
});
