import { Controller, Get, Query, Param } from '@nestjs/common';
import { ServicesReader } from './public-services.reader';

@Controller('public/services')
export class ClientServiceBookingsController {
  constructor(private readonly reader: ServicesReader) {}

  @Get('active')
  listActive(@Query('locationId') locationId?: string): Promise<unknown[]> {
    return locationId ? this.reader.listForLocation(locationId) : this.reader.listActiveWith();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<unknown> {
    return this.reader.findById(id);
  }
}
