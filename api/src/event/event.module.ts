import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { EventActiveAttemptEntity } from './entities/event-active-attempt.entity.js';
import { EventEntryEntity } from './entities/event-entry.entity.js';
import { EventRealtimeGateway } from './event-realtime.gateway.js';
import { EventPublicController } from './event-public.controller.js';
import { EventService } from './event.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntryEntity,
      EventActiveAttemptEntity,
      ExerciseCatalogEntity,
    ]),
    RealtimeModule,
  ],
  controllers: [EventPublicController],
  providers: [EventService, EventRealtimeGateway],
})
export class EventModule {}
