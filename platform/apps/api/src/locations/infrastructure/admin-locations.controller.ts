// Admin locations CRUD — MNG-ADM-01…03. Мутації через API, не через Prisma
// (admin-screens.md). Захист ендпоінтів — admin-сесією (адмінка), як admin-auth.

import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, UseFilters } from '@nestjs/common';
import type { CreateLocationInput } from '../application/create-location';
import type { UpdateLocationInput } from '../application/update-location';
import { LocationsExceptionFilter } from './locations.exception-filter';
import type { CreateLocationDto, LocationDto, UpdateLocationDto } from './admin-locations.dto';
import { toLocationDto, toLocationLogoDto } from './admin-locations.dto';
import { ADMIN_LOCATION_DEPS, type AdminLocationDeps } from './location-http.deps';

export type {
  CreateLocationDto,
  UpdateLocationDto,
  LocationDto,
  LocationLogoDto,
} from './admin-locations.dto';
export { toLocationDto, toLocationLogoDto } from './admin-locations.dto';

@Controller('admin/locations')
@UseFilters(LocationsExceptionFilter)
export class AdminLocationsController {
  constructor(@Inject(ADMIN_LOCATION_DEPS) private readonly deps: AdminLocationDeps) {}

  @Get()
  listAll(): Promise<LocationDto[]> {
    return this.deps.list.list().then((locations) => locations.map((l) => toLocationDto(l)));
  }

  /** З редактора логотипа: локація віддається зі своїм logo (T-4609a). */
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<LocationDto> {
    const location = await this.deps.list.findById(id);
    const logo = await this.deps.logos.findByLocationId(location.id);
    return toLocationDto(location, logo ? toLocationLogoDto(logo, this.deps.media) : null);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLocation(@Body() dto: CreateLocationDto): Promise<{ id: string }> {
    const input: CreateLocationInput = {
      code: dto.code,
      name: dto.name,
      address: dto.address,
      addressParts: dto.addressParts,
      lat: dto.lat,
      lng: dto.lng,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      hours: dto.hours,
    };
    return this.deps.create.handle(input);
  }

  @Patch(':id')
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto
  ): Promise<{ id: string }> {
    const input: UpdateLocationInput = { id, ...dto };
    return this.deps.update.handle(input);
  }
}
