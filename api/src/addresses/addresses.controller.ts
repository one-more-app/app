import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { AddressesService } from './addresses.service.js';

@Controller('/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/search')
  async searchAddresses(
    @Query('q') q?: string,
    @Query('lat') latRaw?: string,
    @Query('lng') lngRaw?: string,
  ) {
    const lat = latRaw != null ? Number.parseFloat(latRaw) : undefined;
    const lng = lngRaw != null ? Number.parseFloat(lngRaw) : undefined;
    return await this.addressesService.searchAddresses({
      q,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:placeId')
  async getAddressDetails(@Param('placeId') placeId: string) {
    return await this.addressesService.getAddressDetails(placeId);
  }
}
