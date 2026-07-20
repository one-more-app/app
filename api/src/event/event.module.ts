import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';
import { EventActiveAttemptEntity } from './entities/event-active-attempt.entity.js';
import { EventEntryEntity } from './entities/event-entry.entity.js';
import { EventPublicController } from './event-public.controller.js';
import { EventService } from './event.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntryEntity,
      EventActiveAttemptEntity,
      ExerciseCatalogEntity,
    ]),
  ],
  controllers: [EventPublicController],
  providers: [EventService],
})
export class EventModule {}
