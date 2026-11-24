/* eslint-disable max-lines -- T-230/T-4458: the two provider groups share one wiring module. */
// T-230/T-4458: збірка use case-ів графіка. Інтерфейси не є Nest-токенами,
// тому кожен handler збирається явною фабрикою; транзакція — PrismaUnitOfWork.
import type { Provider } from '@nestjs/common';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { PrismaOutboxPublisher } from '../../locations/infrastructure/prisma-locations-outbox';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaAvailabilityRepository } from './prisma-availability.repository';
import { PrismaBookingRepository } from './prisma-booking.repository';
import { PrismaSchedulePolicyRepository } from './prisma-schedule-policy.repository';
import { PrismaScheduleChangeLogRepository } from './prisma-schedule-change-log.repository';
import { SetAvailabilityHandler, ListAvailabilityHandler } from '../application/set-availability';
import { EditOwnScheduleHandler } from '../application/edit-own-schedule';
import { PrismaScheduleChangeRepository } from './prisma-schedule-change.repository';
import { PrismaScheduleChangeEvents } from './prisma-schedule-change.events';
import { PrismaScheduleChangeAvailability } from './prisma-schedule-change.availability';
import { RescheduleScheduleChangeApplier } from './prisma-schedule-change.applier';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import {
  SCHEDULE_CHANGE_APPLIER,
  SCHEDULE_CHANGE_AVAILABILITY,
  SCHEDULE_CHANGE_CLOCK,
  SCHEDULE_CHANGE_EVENTS,
  SCHEDULE_CHANGE_REPOSITORY,
  SCHEDULE_CHANGE_UOW,
  ScheduleChangeApprovalService,
} from '../application/schedule-change-approval.service';

const clock = { now: () => new Date() };

export const scheduleSelfServiceProviders: Provider[] = [
  PrismaSchedulePolicyRepository,
  PrismaScheduleChangeLogRepository,
  {
    provide: SetAvailabilityHandler,
    useFactory: (...deps: any[]) =>
      new SetAvailabilityHandler({
        scheduleRepo: deps[0],
        locations: deps[1],
        bookings: deps[2],
        outbox: deps[3],
        uow: deps[4],
        changeLog: deps[5],
      }),
    inject: [
      PrismaAvailabilityRepository,
      PrismaLocationRepository,
      PrismaBookingRepository,
      PrismaOutboxPublisher,
      PrismaUnitOfWork,
      PrismaScheduleChangeLogRepository,
    ],
  },
  {
    provide: ListAvailabilityHandler,
    useFactory: (scheduleRepo: PrismaAvailabilityRepository) =>
      new ListAvailabilityHandler({ scheduleRepo }),
    inject: [PrismaAvailabilityRepository],
  },
  {
    provide: EditOwnScheduleHandler,
    useFactory: (...deps: any[]) =>
      new EditOwnScheduleHandler({
        scheduleRepo: deps[0],
        policies: deps[1],
        changeLog: deps[2],
        locations: deps[3],
        bookings: deps[4],
        outbox: deps[5],
        uow: deps[6],
      }),
    inject: [
      PrismaAvailabilityRepository,
      PrismaSchedulePolicyRepository,
      PrismaScheduleChangeLogRepository,
      PrismaLocationRepository,
      PrismaBookingRepository,
      PrismaOutboxPublisher,
      PrismaUnitOfWork,
    ],
  },
];

export const scheduleChangeProviders: Provider[] = [
  PrismaScheduleChangeRepository,
  PrismaScheduleChangeEvents,
  PrismaScheduleChangeAvailability,
  { provide: SCHEDULE_CHANGE_REPOSITORY, useExisting: PrismaScheduleChangeRepository },
  { provide: SCHEDULE_CHANGE_EVENTS, useExisting: PrismaScheduleChangeEvents },
  { provide: SCHEDULE_CHANGE_AVAILABILITY, useExisting: PrismaScheduleChangeAvailability },
  { provide: SCHEDULE_CHANGE_CLOCK, useValue: clock },
  { provide: SCHEDULE_CHANGE_UOW, useExisting: PrismaUnitOfWork },
  { provide: SCHEDULE_CHANGE_APPLIER, useExisting: RescheduleScheduleChangeApplier },
  {
    provide: ScheduleChangeApprovalService,
    useFactory: (...deps: any[]) =>
      new ScheduleChangeApprovalService(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5]),
    inject: [
      SCHEDULE_CHANGE_REPOSITORY,
      SCHEDULE_CHANGE_EVENTS,
      SCHEDULE_CHANGE_AVAILABILITY,
      SCHEDULE_CHANGE_CLOCK,
      SCHEDULE_CHANGE_UOW,
      SCHEDULE_CHANGE_APPLIER,
    ],
  },
  {
    provide: RescheduleScheduleChangeApplier,
    useFactory: (reschedule: RescheduleAppointment) =>
      new RescheduleScheduleChangeApplier(reschedule),
    inject: [RescheduleAppointment],
  },
];
