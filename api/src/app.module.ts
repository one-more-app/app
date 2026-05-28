import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { TypeormDatabaseModule } from './database/typeorm.module.js';
import { ExercisesModule } from './exercises/exercises.module.js';
import { PerformanceEntriesModule } from './performance/performance-entries.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { TrackedExercisesModule } from './tracked-exercises/tracked-exercises.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['api/.env', '.env'],
    }),
    TypeormDatabaseModule,
    AuthModule,
    ProfileModule,
    TrackedExercisesModule,
    PerformanceEntriesModule,
    ExercisesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
