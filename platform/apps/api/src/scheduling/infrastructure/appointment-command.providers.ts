// Провайдери команд життєвого циклу Appointment (T-042/T-043/T-4533):
// контролери /admin/appointments/* отримують use cases із Transactional UoW.
import type { Provider } from '@nestjs/common';
import { AppointmentLifecycle } from '../application/appointment-lifecycle.use-case';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import { SetAppointmentReference } from '../application/set-appointment-reference.use-case';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { PrismaAppointmentRepository } from './prisma-appointment.repository';
import { PrismaAppointmentTimeMover } from './prisma-appointment-time-mover';
import { PrismaAvailabilityRepository } from './prisma-availability.repository';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';

export const appointmentCommandProviders: Provider[] = [
  PrismaUnitOfWork,
  PrismaAppointmentTimeMover,
  {
    provide: AppointmentLifecycle,
    useFactory: (appointments: PrismaAppointmentRepository, uow: PrismaUnitOfWork) =>
      new AppointmentLifecycle({ appointments, uow }),
    inject: [PrismaAppointmentRepository, PrismaUnitOfWork],
  },
  {
    provide: SetAppointmentReference,
    useFactory: (appointments: PrismaAppointmentRepository, uow: PrismaUnitOfWork) =>
      new SetAppointmentReference({ appointments, uow }),
    inject: [PrismaAppointmentRepository, PrismaUnitOfWork],
  },
  {
    provide: RescheduleAppointment,
    useFactory: (...deps: any[]) =>
      new RescheduleAppointment({
        appointments: deps[0],
        scheduleRepo: deps[1],
        locationRepo: deps[2],
        mover: deps[3],
      }),
    inject: [
      PrismaAppointmentRepository,
      PrismaAvailabilityRepository,
      PrismaLocationRepository,
      PrismaAppointmentTimeMover,
    ],
  },
];