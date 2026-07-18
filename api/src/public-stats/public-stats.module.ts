import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { PublicStatsController } from './public-stats.controller.js';
import { PublicStatsService } from './public-stats.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceEntryEntity])],
  controllers: [PublicStatsController],
  providers: [PublicStatsService],
})
export class PublicStatsModule {}
