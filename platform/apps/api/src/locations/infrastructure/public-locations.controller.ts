// Публічний API локацій (web-screens §1–2): список активних, «найближчі»
// (геолокація, фаза 9+), деталі за кодом. Один контролер, щоб порядок
// маршрутів гарантував: /nearest парситься раніше, ніж /:code. Вимкнена
// локація зникає зі списку негайно (MNG-ADM-02); за прямим URL вона
// повертається з active=false — сторінка показує явний стан (T-4513).

import { Controller, Get, Inject, Param, Query, UseFilters } from '@nestjs/common';
import type { LocationDetails } from '../application/get-location-details';
import { LocationsExceptionFilter } from './locations.exception-filter';
import { geoFromQuery, toNearestLocationsResponse } from './nearest-locations.dto';
import type { GeoQuery } from './nearest-locations.dto';
import { toLocationDto, toLocationLogoDto } from './admin-locations.controller';
import type { LocationDto } from './admin-locations.controller';
import type { LocationLogoRepository } from '../domain/ports';
import { PUBLIC_LOCATION_DEPS, type PublicLocationDeps } from './location-http.deps';

@Controller('locations')
@UseFilters(LocationsExceptionFilter)
export class PublicLocationsController {
  constructor(@Inject(PUBLIC_LOCATION_DEPS) private readonly deps: PublicLocationDeps) {}

  /** Список активних: один запит логотипів на всі локації (T-4609b), без N+1. */
  @Get()
  async listActive(): Promise<LocationDto[]> {
    const locations = await this.deps.list.listActive();
    const logos = await this.deps.logos.listByLocationIds(locations.map((l) => l.id));
    const byLocation = new Map(logos.map((logo) => [logo.locationId, logo]));
    return locations.map((location) =>
      toLocationDto(location, this.logoDto(byLocation.get(location.id) ?? null))
    );
  }

  @Get('nearest')
  async nearestLocations(@Query() query: GeoQuery) {
    const coords = geoFromQuery(query);
    const result = await this.deps.nearest.handle(
      coords ? { lat: coords.lat, lng: coords.lng } : {}
    );
    return toNearestLocationsResponse(result);
  }

  @Get(':code')
  async byCode(@Param('code') code: string): Promise<LocationDto> {
    // Вимкнена локація повертається з active=false і своїм логотипом (T-4513).
    const details: LocationDetails = await this.deps.details.handle(code);
    const logo = await this.deps.logos.findByLocationId(details.location.id);
    return toLocationDto(details.location, this.logoDto(logo));
  }

  private logoDto(logo: Awaited<ReturnType<LocationLogoRepository['findByLocationId']>>) {
    return logo ? toLocationLogoDto(logo, this.deps.media) : null;
  }
}
