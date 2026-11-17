import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseFilters,
  NotFoundException,
} from '@nestjs/common';
import { AssignStaffHandler } from '../application/assign-staff';
import { ListStaffHandler } from '../application/list-staff';
import { UnassignStaffHandler } from '../application/unassign-staff';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { LocationsExceptionFilter } from './locations.exception-filter';

export const STAFF_CONTROLLER_DEPS = Symbol('STAFF_CONTROLLER_DEPS');
interface StaffControllerDeps {
  assign: AssignStaffHandler;
  unassign: UnassignStaffHandler;
  list: ListStaffHandler;
  users: PrismaUserRepository;
}

@Controller('admin/locations/:locationId/staff')
@UseFilters(LocationsExceptionFilter)
export class AdminStaffController {
  constructor(@Inject(STAFF_CONTROLLER_DEPS) private readonly deps: StaffControllerDeps) {}

  @Get()
  async byLocation(@Param('locationId') locationId: string) {
    return (await this.deps.list.listByLocation(locationId)).map(({ id, barberId, createdAt }) => ({
      id,
      barberId,
      createdAt,
    }));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async assignBarber(@Param('locationId') locationId: string, @Body() body: { barberId: string }) {
    const barber = await this.deps.users.findById(body.barberId);
    if (!barber || barber.role !== 'barber' || !barber.active)
      throw new NotFoundException('Active barber not found');
    return this.deps.assign.handle({ barberId: barber.id, locationId });
  }

  @Delete(':assignmentId')
  async remove(@Param('assignmentId') assignmentId: string) {
    return this.deps.unassign.handle(assignmentId);
  }
}
