// Admin locations lifecycle — MNG-ADM-02 (вимкнення/вмикання). Вимкнена
// локація зникає зі створенням запису та веба негайно.

import { Controller, HttpCode, HttpStatus, Param, Post, UseFilters } from '@nestjs/common';
import { DisableLocationHandler, EnableLocationHandler } from '../application/set-location-active';
import { LocationsExceptionFilter } from './locations.exception-filter';

@Controller('admin/locations')
@UseFilters(LocationsExceptionFilter)
export class AdminLocationsLifecycleController {
  constructor(
    private readonly disable: DisableLocationHandler,
    private readonly enable: EnableLocationHandler
  ) {}

  @Post(':id/disable')
  @HttpCode(HttpStatus.OK)
  async disableLocation(@Param('id') id: string): Promise<{ id: string }> {
    return this.disable.handle(id);
  }

  @Post(':id/enable')
  @HttpCode(HttpStatus.OK)
  async enableLocation(@Param('id') id: string): Promise<{ id: string }> {
    return this.enable.handle(id);
  }
}
