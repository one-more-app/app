import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dataSource from './data-source.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { replayUserProgress } from '../progress/lib/replay-user-progress.js';

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const userIdArg = getArgValue('--user-id');
  const emailArg = getArgValue('--email');

  const ds = dataSource;
  if (!ds.isInitialized) await ds.initialize();

  const userRepo = ds.getRepository(UserEntity);

  let userIds: string[] = [];

  if (userIdArg) {
    userIds = [userIdArg];
  } else if (emailArg) {
    const user = await userRepo.findOne({ where: { email: emailArg } });
    if (!user) {
      throw new Error(`Utilisateur introuvable pour l'email : ${emailArg}`);
    }
    userIds = [user.id];
  } else {
    const users = await userRepo.find({
      select: ['id'],
      order: { createdAt: 'ASC' },
    });
    userIds = users.map((u) => u.id);
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Recalcul XP / streak pour ${userIds.length} compte(s)...`,
  );

  let totalXpGranted = 0;
  let totalEvents = 0;

  for (const userId of userIds) {
    const run = async () => {
      if (dryRun) {
        return ds.transaction(async (manager) => {
          const result = await replayUserProgress(manager, userId);
          throw new DryRunRollback(result);
        });
      }
      return ds.transaction((manager) => replayUserProgress(manager, userId));
    };

    try {
      const result = await run();
      totalXpGranted += result.totalXp;
      totalEvents += result.eventCount;
      console.log(
        `  ${userId}: ${result.performanceCount} perf(s), ${result.eventCount} event(s), ${result.totalXp} XP, streak ${result.streak.current} (max ${result.streak.longest})`,
      );
    } catch (err) {
      if (err instanceof DryRunRollback) {
        const result = err.result;
        totalXpGranted += result.totalXp;
        totalEvents += result.eventCount;
        console.log(
          `  ${userId}: ${result.performanceCount} perf(s), ${result.eventCount} event(s), ${result.totalXp} XP, streak ${result.streak.current} (max ${result.streak.longest})`,
        );
        continue;
      }
      throw err;
    }
  }

  await ds.destroy();
  console.log(
    dryRun
      ? `Dry-run terminé (${totalEvents} event(s), ${totalXpGranted} XP simulés, aucune écriture).`
      : `Terminé (${totalEvents} event(s), ${totalXpGranted} XP recalculés).`,
  );
}

class DryRunRollback extends Error {
  constructor(readonly result: Awaited<ReturnType<typeof replayUserProgress>>) {
    super('dry-run rollback');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
