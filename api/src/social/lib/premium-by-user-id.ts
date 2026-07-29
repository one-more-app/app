import { In, Repository } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

export async function loadPremiumByUserIds(
  usersRepo: Repository<UserEntity>,
  userIds: string[],
): Promise<Map<string, boolean>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  const users = await usersRepo.find({
    where: { id: In(unique) },
    select: ['id', 'isPremium'],
  });

  return new Map(users.map((user) => [user.id, user.isPremium]));
}
