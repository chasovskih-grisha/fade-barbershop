// Admin CRUD matrix "barber x service x location" (T-4522) + slot policy per location.
// No hex; range validation via number/slice; policy change = info banner
// "for new bookings only" (already-generated slots are not rewritten).

import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, UseFilters } from '@nestjs/common';
import { SchedulingExceptionFilter } from './scheduling.exception-filter';
import { ADMIN_BARBER_SERVICE_IO, type AdminBarberServiceDeps } from './admin-barber-service.dto';
import type {
  BarberServiceAssignmentForBarberDto,
  BarberServiceAssignmentsForLocationDto,
  CreateOrActivateAssignmentDto,
  SlotPolicyDto,
  UpdateSlotPolicyDto,
} from './admin-barber-service.dto';

export { ADMIN_BARBER_SERVICE_IO } from './admin-barber-service.dto';
export type {
  BarberServiceAssignmentForBarberDto,
  BarberServiceAssignmentsForLocationDto,
  CreateOrActivateAssignmentDto,
  SlotPolicyDto,
  UpdateSlotPolicyDto,
  AdminBarberServiceDeps,
};

@Controller('admin/barber-service')
@UseFilters(SchedulingExceptionFilter)
export class AdminBarberServiceController {
  constructor(@Inject(ADMIN_BARBER_SERVICE_IO) private readonly deps: AdminBarberServiceDeps) {}

  // ---------- matrix ----------

  @Get('barbers/:barberId/locations/:locationId/services')
  listForBarberAndLocation(
    @Param('barberId') barberId: string,
    @Param('locationId') locationId: string
  ): Promise<BarberServiceAssignmentForBarberDto> {
    return this.deps.listForBarberAndLocation(barberId, locationId);
  }

  @Get('locations/:locationId/services/:serviceId/barbers')
  listForServiceAndLocation(
    @Param('locationId') locationId: string,
    @Param('serviceId') serviceId: string
  ): Promise<BarberServiceAssignmentsForLocationDto> {
    return this.deps.listForServiceAndLocation(locationId, serviceId);
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  createOrActivate(@Body() dto: CreateOrActivateAssignmentDto): Promise<{ id: string }> {
    return this.deps.setAssignment({
      barberId: dto.barberId,
      locationId: dto.locationId,
      serviceId: dto.serviceId,
      active: true,
    });
  }

  @Patch('assignments/:barberId/:locationId/:serviceId/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('barberId') barberId: string,
    @Param('locationId') locationId: string,
    @Param('serviceId') serviceId: string
  ): Promise<{ id: string }> {
    return this.deps.setAssignment({ barberId, locationId, serviceId, active: false });
  }

  @Patch('assignments/:barberId/:locationId/activate/:serviceId')
  @HttpCode(HttpStatus.OK)
  activate(
    @Param('barberId') barberId: string,
    @Param('locationId') locationId: string,
    @Param('serviceId') serviceId: string
  ): Promise<{ id: string }> {
    return this.deps.setAssignment({ barberId, locationId, serviceId, active: true });
  }

  // ---------- slot policy ----------

  @Get('locations/:locationId/slot-policy')
  getSlotPolicy(@Param('locationId') locationId: string): Promise<SlotPolicyDto> {
    return this.deps.getSlotPolicy(locationId);
  }

  @Post('locations/:locationId/slot-policy')
  @HttpCode(HttpStatus.CREATED)
  setSlotPolicy(
    @Param('locationId') locationId: string,
    @Body() dto: UpdateSlotPolicyDto
  ): Promise<SlotPolicyDto> {
    return this.deps.saveSlotPolicy(locationId, dto);
  }
}
