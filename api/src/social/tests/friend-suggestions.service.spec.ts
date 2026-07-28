import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { FriendshipStatus } from '../entities/friendship-status.enum.js';
import {
  FriendSuggestionsService,
  buildSuggestionReasons,
  rankFriendSuggestionCandidates,
} from '../friend-suggestions.service.js';

describe('rankFriendSuggestionCandidates', () => {
  it('ranks combo above FoF above gym-only', () => {
    const candidates = new Map([
      ['gym-only', { mutualFriendsCount: 0, sameGym: true }],
      ['fof-1', { mutualFriendsCount: 1, sameGym: false }],
      ['combo', { mutualFriendsCount: 1, sameGym: true }],
      ['fof-3', { mutualFriendsCount: 3, sameGym: false }],
    ]);

    const ranked = rankFriendSuggestionCandidates(candidates).map(
      (r) => r.userId,
    );
    expect(ranked).toEqual(['combo', 'fof-3', 'fof-1', 'gym-only']);
  });

  it('sorts FoF by mutual count descending', () => {
    const candidates = new Map([
      ['a', { mutualFriendsCount: 2, sameGym: false }],
      ['b', { mutualFriendsCount: 5, sameGym: false }],
      ['c', { mutualFriendsCount: 1, sameGym: false }],
    ]);
    expect(
      rankFriendSuggestionCandidates(candidates).map((r) => r.userId),
    ).toEqual(['b', 'a', 'c']);
  });
});

describe('buildSuggestionReasons', () => {
  it('builds mutual, gym, and combo reasons', () => {
    expect(buildSuggestionReasons(2, false)).toEqual(['mutual_friends']);
    expect(buildSuggestionReasons(0, true)).toEqual(['same_gym']);
    expect(buildSuggestionReasons(1, true)).toEqual([
      'mutual_friends',
      'same_gym',
    ]);
    expect(buildSuggestionReasons(0, false)).toEqual([]);
  });
});

describe('FriendSuggestionsService', () => {
  const viewerId = 'viewer';
  const friendA = 'friend-a';
  const friendB = 'friend-b';
  const fofUser = 'fof-user';
  const gymUser = 'gym-user';
  const comboUser = 'combo-user';
  const pendingUser = 'pending-user';
  const privateUser = 'private-user';

  let friendshipsRepo: {
    find: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let profilesRepo: {
    find: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let gymsRepo: {
    findOne: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    find: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  let service: FriendSuggestionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    friendshipsRepo = {
      find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    profilesRepo = {
      find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    gymsRepo = {
      findOne: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    service = new FriendSuggestionsService(
      friendshipsRepo as any,
      profilesRepo as any,
      gymsRepo as any,
    );
  });

  function friendship(
    requesterId: string,
    addresseeId: string,
    status: FriendshipStatus,
  ) {
    return { requesterId, addresseeId, status };
  }

  function profile(
    userId: string,
    opts: {
      discoverableByUsername?: boolean;
      searchableByName?: boolean;
      username?: string | null;
    } = {},
  ) {
    return {
      userId,
      firstName: userId,
      lastName: null,
      username: opts.username ?? userId,
      avatarUrl: null,
      discoverableByUsername: opts.discoverableByUsername ?? true,
      searchableByName: opts.searchableByName ?? true,
    };
  }

  it('suggests FoF with mutual count', async () => {
    // 1st find: all friendships with viewer (exclusion)
    // 2nd find: accepted with viewer (getAcceptedFriendIds)
    // 3rd find: edges from friends
    friendshipsRepo.find
      .mockResolvedValueOnce([
        friendship(viewerId, friendA, FriendshipStatus.ACCEPTED),
      ])
      .mockResolvedValueOnce([
        friendship(viewerId, friendA, FriendshipStatus.ACCEPTED),
      ])
      .mockResolvedValueOnce([
        friendship(friendA, fofUser, FriendshipStatus.ACCEPTED),
      ]);

    gymsRepo.findOne.mockResolvedValue(null);
    profilesRepo.find.mockResolvedValue([profile(fofUser)]);

    const suggestions = await service.suggest(viewerId);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      userId: fofUser,
      mutualFriendsCount: 1,
      reasons: ['mutual_friends'],
    });
  });

  it('suggests same-gym users when viewer has a gym', async () => {
    friendshipsRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    gymsRepo.findOne.mockResolvedValue({
      userId: viewerId,
      placeId: 'place-1',
    });
    gymsRepo.find.mockResolvedValue([
      { userId: viewerId, placeId: 'place-1' },
      { userId: gymUser, placeId: 'place-1' },
    ]);
    profilesRepo.find.mockResolvedValue([profile(gymUser)]);

    const suggestions = await service.suggest(viewerId);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      userId: gymUser,
      mutualFriendsCount: 0,
      reasons: ['same_gym'],
    });
  });

  it('ranks combo above FoF and gym-only', async () => {
    friendshipsRepo.find
      .mockResolvedValueOnce([
        friendship(viewerId, friendA, FriendshipStatus.ACCEPTED),
        friendship(viewerId, friendB, FriendshipStatus.ACCEPTED),
      ])
      .mockResolvedValueOnce([
        friendship(viewerId, friendA, FriendshipStatus.ACCEPTED),
        friendship(viewerId, friendB, FriendshipStatus.ACCEPTED),
      ])
      .mockResolvedValueOnce([
        friendship(friendA, fofUser, FriendshipStatus.ACCEPTED),
        friendship(friendA, comboUser, FriendshipStatus.ACCEPTED),
        friendship(friendB, comboUser, FriendshipStatus.ACCEPTED),
      ]);

    gymsRepo.findOne.mockResolvedValue({
      userId: viewerId,
      placeId: 'place-1',
    });
    gymsRepo.find.mockResolvedValue([
      { userId: viewerId, placeId: 'place-1' },
      { userId: gymUser, placeId: 'place-1' },
      { userId: comboUser, placeId: 'place-1' },
    ]);
    profilesRepo.find.mockResolvedValue([
      profile(comboUser),
      profile(fofUser),
      profile(gymUser),
    ]);

    const suggestions = await service.suggest(viewerId);
    expect(suggestions.map((s) => s.userId)).toEqual([
      comboUser,
      fofUser,
      gymUser,
    ]);
    expect(suggestions[0]?.reasons).toEqual(['mutual_friends', 'same_gym']);
    expect(suggestions[0]?.mutualFriendsCount).toBe(2);
  });

  it('excludes pending friendships from suggestions', async () => {
    friendshipsRepo.find
      .mockResolvedValueOnce([
        friendship(viewerId, pendingUser, FriendshipStatus.PENDING),
      ])
      .mockResolvedValueOnce([]);

    gymsRepo.findOne.mockResolvedValue({
      userId: viewerId,
      placeId: 'place-1',
    });
    gymsRepo.find.mockResolvedValue([
      { userId: viewerId, placeId: 'place-1' },
      { userId: pendingUser, placeId: 'place-1' },
      { userId: gymUser, placeId: 'place-1' },
    ]);
    profilesRepo.find.mockResolvedValue([profile(gymUser)]);

    const suggestions = await service.suggest(viewerId);
    expect(suggestions.map((s) => s.userId)).toEqual([gymUser]);
  });

  it('skips gym branch when viewer has no gym', async () => {
    friendshipsRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    gymsRepo.findOne.mockResolvedValue(null);

    const suggestions = await service.suggest(viewerId);
    expect(suggestions).toEqual([]);
    expect(gymsRepo.find).not.toHaveBeenCalled();
    expect(profilesRepo.find).not.toHaveBeenCalled();
  });

  it('filters out profiles with both privacy flags off', async () => {
    friendshipsRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    gymsRepo.findOne.mockResolvedValue({
      userId: viewerId,
      placeId: 'place-1',
    });
    gymsRepo.find.mockResolvedValue([
      { userId: viewerId, placeId: 'place-1' },
      { userId: privateUser, placeId: 'place-1' },
      { userId: gymUser, placeId: 'place-1' },
    ]);
    profilesRepo.find.mockResolvedValue([
      profile(privateUser, {
        discoverableByUsername: false,
        searchableByName: false,
      }),
      profile(gymUser),
    ]);

    const suggestions = await service.suggest(viewerId);
    expect(suggestions.map((s) => s.userId)).toEqual([gymUser]);
  });

  it('keeps a profile discoverable by username only', async () => {
    friendshipsRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    gymsRepo.findOne.mockResolvedValue({
      userId: viewerId,
      placeId: 'place-1',
    });
    gymsRepo.find.mockResolvedValue([
      { userId: viewerId, placeId: 'place-1' },
      { userId: gymUser, placeId: 'place-1' },
    ]);
    profilesRepo.find.mockResolvedValue([
      profile(gymUser, {
        discoverableByUsername: true,
        searchableByName: false,
      }),
    ]);

    const suggestions = await service.suggest(viewerId);
    expect(suggestions).toHaveLength(1);
  });
});
