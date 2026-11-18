import { Controller, Patch, HttpCode, Param, Body, Get, UseFilters } from '@nestjs/common';
import { SetAvailabilityHandler } from '../application/set-availability';
import { ListAvailabilityHandler } from '../application/list-availability';
import { SchedulingHttpMapper } from '../scheduling-http.mapper';
import { AvailabilityWindowData, InvalidScheduleInputError } from '../domain/availability';
import { AvailabilityExceptionFilter } from './availability.exception-filter';

/**
 * Admin API (protected elsewhere) for managing barber availability.
 */
@Controller('admin/barbers/:barberId/availability')
@UseFilters(AvailabilityExceptionFilter)
export class AdminAvailabilityController {
  constructor(
    private readonly setHandler: SetAvailabilityHandler,
    private readonly listHandler: ListAvailabilityHandler
  ) {}

  @Patch()
  @HttpCode(202)
  async setAvailability(
    @Param('barberId') barberId: string,
    @Body() payload: { locationId: string; windows: AvailabilityWindowData[] }
  ) {
    if (!payload || !Array.isArray(payload.windows))
      throw new InvalidScheduleInputError('windows must be an array');
    const result = await this.setHandler.handle({
      barberId,
      locationId: payload.locationId,
      windows: payload.windows,
    });
    return SchedulingHttpMapper.toResponse(result.version);
  }

  @Get(':locationId')
  async getAvailability(
    @Param('barberId') barberId: string,
    @Param('locationId') locationId: string
  ) {
    const schedule = await this.listHandler.listByBarberAndLocation(barberId, locationId);
    return schedule
      ? {
          barberId: schedule.getBarberId(),
          locationId: schedule.getLocationId(),
          windows: schedule.getWindows(),
          version: schedule.getVersion(),
        }
      : { barberId, locationId, windows: [], version: 0 };
  }
}
