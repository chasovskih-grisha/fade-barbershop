import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { IdentityModule } from '../../identity/infrastructure/identity.module';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { PrismaSessionRepository } from '../../identity/infrastructure/prisma-session-repository';
import { hashToken } from '../../identity/domain/otp-code';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createLocation } from '../../locations/test-helpers.fakes';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaOutboxPublisher } from '../../locations/infrastructure/prisma-locations-outbox';
import { Booking } from '../domain/booking';
import { PrismaBookingRepository } from '../infrastructure/prisma-booking.repository';
import { PrismaAvailabilityRepository } from '../infrastructure/prisma-availability.repository';
import { PrismaScheduleChangeLogRepository } from '../infrastructure/prisma-schedule-change-log.repository';
import { SchedulingModule } from '../scheduling.module';

export async function buildAdminAvailabilityApp(bookings: Booking[]): Promise<{
  app: INestApplication;
  schedules: Map<string, unknown>;
  changeLog: { append: jest.Mock; listByBarber: jest.Mock; listAll: jest.Mock };
}> {
  const schedules = new Map<string, unknown>();
  const users = {
    findById: async (id: string) =>
      id === 'admin-1'
        ? { id: 'admin-1', role: 'admin', active: true }
        : id === 'barber-1'
          ? { id: 'barber-1', role: 'barber', active: true, selfSchedule: true }
          : null,
  };
  const sessions = {
    findByTokenHash: async (hash: string) => {
      if (hash === hashToken('admin-token'))
        return { userId: 'admin-1', channel: 'admin', revokedAt: null, active: true };
      if (hash === hashToken('barber-token'))
        return {
          id: 'session-barber',
          userId: 'barber-1',
          channel: 'mobile',
          revokedAt: null,
          active: true,
          accessValid: () => true,
        };
      return null;
    },
  };
  const changeLog = {
    append: jest.fn(async () => undefined),
    listByBarber: jest.fn(async () => []),
    listAll: jest.fn(async () => []),
  };
  const scheduleRepo = {
    findByBarberAndLocation: async (barberId: string, locationId: string) =>
      schedules.get(`${barberId}:${locationId}`) ?? null,
    save: async (schedule: { getBarberId: () => string; getLocationId: () => string }) =>
      schedules.set(`${schedule.getBarberId()}:${schedule.getLocationId()}`, schedule),
    listAllByLocation: async () => [...schedules.values()],
  };
  const module = await Test.createTestingModule({ imports: [IdentityModule, SchedulingModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: async (work: (tx: object) => Promise<unknown>) => work({}),
      user: {
        findUnique: async ({ where }: { where: { id: string } }) => users.findById(where.id),
      },
      staffAssignment: { findUnique: async () => ({ id: 'assignment-1' }) },
    })
    .overrideProvider(PrismaUserRepository)
    .useValue(users)
    .overrideProvider(PrismaSessionRepository)
    .useValue(sessions)
    .overrideProvider(PrismaLocationRepository)
    .useValue({
      findById: async (id: string) => (id === 'location-1' ? createLocation({ id }) : null),
    })
    .overrideProvider(PrismaAvailabilityRepository)
    .useValue(scheduleRepo)
    .overrideProvider(PrismaScheduleChangeLogRepository)
    .useValue(changeLog)
    .overrideProvider(PrismaBookingRepository)
    .useValue({ findForBarberAtLocation: async () => bookings })
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: jest.fn() })
    .compile();
  const app = module.createNestApplication();
  app.use(cookieParser());
  await app.init();
  return { app, schedules, changeLog };
}
