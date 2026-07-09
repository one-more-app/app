import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacesModule } from '../places/places.module.js';
import { UserGymEntity } from './entities/user-gym.entity.js';
import { GymsController } from './gyms.controller.js';
import { GymsService } from './gyms.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserGymEntity]), PlacesModule],
  controllers: [GymsController],
  providers: [GymsService],
  exports: [GymsService, TypeOrmModule],
})
export class GymsModule {}
