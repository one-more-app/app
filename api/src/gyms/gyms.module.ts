import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGymEntity } from './entities/user-gym.entity.js';
import { GooglePlacesService } from './google-places.service.js';
import { GymsController } from './gyms.controller.js';
import { GymsService } from './gyms.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserGymEntity])],
  controllers: [GymsController],
  providers: [GymsService, GooglePlacesService],
  exports: [GymsService, TypeOrmModule],
})
export class GymsModule {}
