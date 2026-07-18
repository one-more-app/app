import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { countPersonalRecords } from './lib/count-personal-records.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class PublicStatsService {
  private cachedCount: number | null = null;
  private cachedAt = 0;

  constructor(
    @InjectRepository(PerformanceEntryEntity)
    private readonly perfRepo: Repository<PerformanceEntryEntity>,
  ) {}

  async getTotalPersonalRecordsCount(): Promise<number> {
    const now = Date.now();
    if (this.cachedCount !== null && now - this.cachedAt < CACHE_TTL_MS) {
      return this.cachedCount;
    }

    const rows = await this.perfRepo.find({
      where: { deletedAt: IsNull() },
      select: {
        id: true,
        trackedExerciseId: true,
        date: true,
        weight: true,
        reps: true,
        updatedAt: true,
      },
      order: {
        date: 'ASC',
        updatedAt: 'ASC',
        id: 'ASC',
      },
    });

    const count = countPersonalRecords(rows);
    this.cachedCount = count;
    this.cachedAt = now;
    return count;
  }
}
