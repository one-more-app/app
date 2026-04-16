import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCatalogEntity } from './exercise-catalog.entity.js';
import { ExercisesController } from './exercises.controller.js';
import { ExercisesService } from './exercises.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExerciseCatalogEntity])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
