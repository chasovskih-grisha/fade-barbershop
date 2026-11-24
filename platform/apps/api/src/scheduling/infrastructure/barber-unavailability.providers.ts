// T-4616a: збірка use case-ів недоступності. Інтерфейси не є Nest-токенами,
// тому всі залежності збираються явними фабриками.
import type { Provider } from '@nestjs/common';
import { MarkBarberUnavailable } from '../application/mark-barber-unavailable.use-case';
import { ListShiftConflicts } from '../application/list-shift-conflicts.use-case';
import { ResolveShiftConflict } from '../application/resolve-shift-conflict.use-case';
import { SchedulingShiftConflictAvailability } from '../application/shift-conflict-availability';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import { AppointmentLifecycle } from '../application/appointment-lifecycle.use-case';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { PrismaBarberUnavailabilityRepository } from './prisma-barber-unavailability.repository';
import { PrismaShiftConflictRepository } from './prisma-shift-conflict.repository';
import { PrismaBarberServiceAssignmentRepository } from './prisma-barber-service-assignment.repository';
import { PrismaAvailabilityRepository } from './prisma-availability.repository';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaBookingRepository } from './prisma-booking.repository';

const clock = { now: () => new Date() };

export const barberUnavailabilityProviders: Provider[] = [
  PrismaBarberUnavailabilityRepository,
  PrismaShiftConflictRepository,
  PrismaBarberServiceAssignmentRepository,
  {
    provide: MarkBarberUnavailable,
    useFactory: (
      unavailabilities: PrismaBarberUnavailabilityRepository,
      conflicts: PrismaShiftConflictRepository
    ) => new MarkBarberUnavailable({ unavailabilities, conflicts, clock }),
    inject: [PrismaBarberUnavailabilityRepository, PrismaShiftConflictRepository],
  },
  {
    provide: SchedulingShiftConflictAvailability,
    useFactory: (...deps: any[]) =>
      new SchedulingShiftConflictAvailability({
        schedules: deps[0],
        locations: deps[1],
        bookings: deps[2],
        unavailabilities: deps[3],
        barberServices: deps[4],
      }),
    inject: [
      PrismaAvailabilityRepository,
      PrismaLocationRepository,
      PrismaBookingRepository,
      PrismaBarberUnavailabilityRepository,
      PrismaBarberServiceAssignmentRepository,
    ],
  },
  {
    provide: ListShiftConflicts,
    useFactory: (
      conflicts: PrismaShiftConflictRepository,
      availability: SchedulingShiftConflictAvailability
    ) => new ListShiftConflicts({ conflicts, availability }),
    inject: [PrismaShiftConflictRepository, SchedulingShiftConflictAvailability],
  },
  {
    provide: ResolveShiftConflict,
    useFactory: (...deps: any[]) =>
      new ResolveShiftConflict({
        conflicts: deps[0],
        barberServices: deps[1],
        reschedule: deps[2],
        cancel: deps[3],
        uow: deps[4],
        unavailabilities: deps[5],
        clock,
      }),
    inject: [
      PrismaShiftConflictRepository,
      PrismaBarberServiceAssignmentRepository,
      RescheduleAppointment,
      AppointmentLifecycle,
      PrismaUnitOfWork,
      PrismaBarberUnavailabilityRepository,
    ],
  },
];
