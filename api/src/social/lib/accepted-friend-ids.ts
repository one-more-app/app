import type { Repository } from 'typeorm';
import { FriendshipEntity } from '../entities/friendship.entity.js';
import { FriendshipStatus } from '../entities/friendship-status.enum.js';

export async function getAcceptedFriendIds(
  friendshipsRepo: Repository<FriendshipEntity>,
  userId: string,
): Promise<string[]> {
  const friendships = await friendshipsRepo.find({
    where: [
      { requesterId: userId, status: FriendshipStatus.ACCEPTED },
      { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
    ],
  });
  const friendIds = friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );
  return [...new Set(friendIds)];
}
