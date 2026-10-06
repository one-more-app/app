import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConsentService } from '../consent/consent.service.js';
import { UnsubscribeController } from '../consent/unsubscribe.controller.js';

describe('UnsubscribeController', () => {
  let controller: UnsubscribeController;
  const consent = {
    findUserByUnsubscribeToken: jest.fn(),
    isEmailMarketingAllowed: jest.fn(),
    unsubscribeByToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [UnsubscribeController],
      providers: [{ provide: ConsentService, useValue: consent }],
    }).compile();
    controller = module.get(UnsubscribeController);
  });

  it('GET does not unsubscribe', async () => {
    consent.findUserByUnsubscribeToken.mockResolvedValue({ id: 'u1' });
    consent.isEmailMarketingAllowed.mockResolvedValue(true);
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await controller.showUnsubscribe('token', res as never);
    expect(consent.unsubscribeByToken).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });

  it('POST unknown token returns 404', async () => {
    consent.unsubscribeByToken.mockResolvedValue(null);
    await expect(
      controller.confirmUnsubscribe('bad', {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        req: { headers: {} },
      } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('POST is idempotent when called twice', async () => {
    consent.unsubscribeByToken.mockResolvedValue({ id: 'u1' });
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      type: jest.fn().mockReturnThis(),
      req: { headers: {} },
    };
    await controller.confirmUnsubscribe('token', res as never);
    await controller.confirmUnsubscribe('token', res as never);
    expect(consent.unsubscribeByToken).toHaveBeenCalledTimes(2);
  });
});
