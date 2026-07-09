import { Module } from '@nestjs/common';
import { PlacesModule } from '../places/places.module.js';
import { AddressesController } from './addresses.controller.js';
import { AddressesService } from './addresses.service.js';

@Module({
  imports: [PlacesModule],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
