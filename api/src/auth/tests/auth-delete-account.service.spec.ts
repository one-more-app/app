import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GoneException } from '@nestjs/common';
import { IsNull } from 'typeorm';

const { AuthService } = await import('../auth.service.js');

describe('AuthService.deleteAccount', () => {
  const usersRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };
  const profilesRepo = {
    findOne: jest.fn(),
  };
  const sessionsRepo = {
    update: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  const deletionFeedbackRepo = {
    save: jest.fn(),
  };
  const deviceTokensRepo = {
    delete: jest.fn(),
  };
  const accountDeletionMail = {
    sendConfirmation: jest.fn(),
  };
  const jwt = { signAsync: jest.fn() };
  const config = { get: jest.fn() };
  const invites = {};
  const referrals = {};
  const redditConversions = {};

  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersRepo as any,
      profilesRepo as any,
      sessionsRepo as any,
      deletionFeedbackRepo as any,
      deviceTokensRepo as any,
      jwt as any,
      config as any,
      invites as any,
      referrals as any,
      redditConversions as any,
      accountDeletionMail as any,
    );
  });

  it('soft-deletes user, revokes sessions, stores feedback, sends email', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.co',
      deletedAt: null,
    } as any);
    profilesRepo.findOne.mockResolvedValue({ firstName: 'Vince' } as any);
    accountDeletionMail.sendConfirmation.mockResolvedValue(undefined as any);

    const result = await service.deleteAccount('user-1', {
      comment: 'prix trop élevé',
    });

    expect(result).toEqual({ ok: true });
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { deletedAt: expect.any(Date) },
    );
    expect(sessionsRepo.update).toHaveBeenCalledWith(
      { userId: 'user-1', revokedAt: IsNull() },
      { revokedAt: expect.any(Date) },
    );
    expect(deviceTokensRepo.delete).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(deletionFeedbackRepo.save).toHaveBeenCalledWith({
      userId: 'user-1',
      comment: 'prix trop élevé',
    });
    expect(accountDeletionMail.sendConfirmation).toHaveBeenCalledWith({
      to: 'a@b.co',
      firstName: 'Vince',
    });
  });

  it('allows deletion without comment', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.co',
      deletedAt: null,
    } as any);
    profilesRepo.findOne.mockResolvedValue({ firstName: null } as any);
    accountDeletionMail.sendConfirmation.mockResolvedValue(undefined as any);

    const result = await service.deleteAccount('user-1', {});

    expect(result).toEqual({ ok: true });
    expect(deletionFeedbackRepo.save).toHaveBeenCalledWith({
      userId: 'user-1',
      comment: null,
    });
  });

  it('does not rollback delete when email fails', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.co',
      deletedAt: null,
    } as any);
    profilesRepo.findOne.mockResolvedValue({ firstName: null } as any);
    accountDeletionMail.sendConfirmation.mockRejectedValue(new Error('smtp'));

    const result = await service.deleteAccount('user-1', {
      comment: 'test',
    });

    expect(result).toEqual({ ok: true });
    expect(usersRepo.update).toHaveBeenCalled();
  });

  it('rejects already soft-deleted accounts', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.co',
      deletedAt: new Date(),
    } as any);

    await expect(service.deleteAccount('user-1', {})).rejects.toBeInstanceOf(
      GoneException,
    );
  });
});

describe('AuthService.loginWithEmail soft-delete', () => {
  const usersRepo = {
    findOne: jest.fn(),
  };
  const profilesRepo = {};
  const sessionsRepo = { save: jest.fn() };
  const deletionFeedbackRepo = {};
  const deviceTokensRepo = {};
  const accountDeletionMail = {};
  const jwt = { signAsync: jest.fn().mockResolvedValue('access' as any) };
  const config = {
    get: jest.fn((key: string) =>
      key === 'JWT_SECRET' ? 'secret' : key === 'JWT_EXPIRES_IN' ? '15m' : undefined,
    ),
  };

  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersRepo as any,
      profilesRepo as any,
      sessionsRepo as any,
      deletionFeedbackRepo as any,
      deviceTokensRepo as any,
      jwt as any,
      config as any,
      {} as any,
      {} as any,
      {} as any,
      accountDeletionMail as any,
    );
  });

  it('refuses login when user is soft-deleted (not found via filter)', async () => {
    usersRepo.findOne.mockResolvedValue(null as any);
    await expect(
      service.loginWithEmail({
        email: 'gone@example.com',
        password: 'password12',
      }),
    ).rejects.toMatchObject({ message: 'Identifiants invalides' });
  });
});
