import { Module } from '@nestjs/common';
import { GooglePlacesService } from './google-places.service.js';

@Module({
  providers: [GooglePlacesService],
  exports: [GooglePlacesService],
})
export class PlacesModule {}
