import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dataSource from './data-source.js';
import { UsernameService } from '../social/username.service.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { UserEntity } from '../auth/entities/user.entity.js';

async function main() {
  const ds = dataSource as DataSource;
  if (!ds.isInitialized) await ds.initialize();

  const profilesRepo = ds.getRepository(UserProfileEntity);
  const usernameService = new UsernameService(
    profilesRepo,
    ds.getRepository(UserEntity),
  );

  const missing = await profilesRepo
    .createQueryBuilder('p')
    .where('p.username IS NULL OR TRIM(p.username) = \'\'')
    .getMany();

  console.log(`Profils sans pseudo : ${missing.length}`);

  for (const profile of missing) {
    const username = await usernameService.ensureUsername(profile.userId);
    console.log(`  ${profile.userId} → @${username}`);
  }

  await ds.destroy();
  console.log('Terminé.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
