// AdminLocationsGeocodeController — геокодування для пікера на карті (T-4405).
// Охороняється глобальним AdminSessionGuard (як решта /admin/*). Окремі
// сегменти /geocode/search і /geocode/reverse не конфліктують з GET /:id.

import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NominatimGeocodeService } from './nominatim-geocode.service';

@ApiTags('admin-locations')
@Controller('admin/locations/geocode')
export class AdminLocationsGeocodeController {
  constructor(private readonly geocode: NominatimGeocodeService) {}

  @Get('search')
  @ApiOperation({ summary: 'Пошук адреси для пікера локації (T-4405)' })
  search(@Query('q') query?: string) {
    return this.geocode.search(query ?? '');
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode точки на карті (T-4405)' })
  reverse(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      throw new BadRequestException('lat and lng are required numbers');
    }
    return this.geocode.reverse(parsedLat, parsedLng);
  }
}
