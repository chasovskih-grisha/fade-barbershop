import { Test } from '@nestjs/testing';
import { BookingModule } from './booking.module';
import { BookingReader } from './infrastructure/booking.reader';
import { AvailableSlots } from './infrastructure/available-slots';
import { ClientBookingsController } from '../scheduling/infrastructure/client-bookings.controller';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaUnitOfWork } from '../shared/prisma/prisma-context';
import { PrismaLocationRepository } from '../locations/infrastructure/prisma-location.repository';
import { PrismaOutboxPublisher } from '../locations/infrastructure/prisma-locations-outbox';
import { CACHED_ROUTING_GEOCODER } from '../locations/infrastructure/locations.module';
import { PrismaUserRepository } from '../identity/infrastructure/prisma-adapters';
import { PrismaServiceRepository } from '../catalog/infrastructure/prisma-service.repository';
import { PrismaBookingRepository } from '../scheduling/infrastructure/prisma-booking.repository';
import { PrismaAvailabilityRepository } from '../scheduling/infrastructure/prisma-availability.repository';

const prismaStub = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: async <T>(work: () => Promise<T>): Promise<T> => work(),
  appSetting: { findUnique: jest.fn(async () => null), upsert: jest.fn(async () => undefined) },
};

describe('BookingModule wiring', () => {
  it('resolves BookingReader and AvailableSlots from the Nest graph', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [BookingModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .overrideProvider(PrismaUnitOfWork)
      .useValue({})
      .overrideProvider(PrismaLocationRepository)
      .useValue({})
      .overrideProvider(PrismaUserRepository)
      .useValue({})
      .overrideProvider(PrismaServiceRepository)
      .useValue({})
      .overrideProvider(PrismaBookingRepository)
      .useValue({})
      .overrideProvider(PrismaAvailabilityRepository)
      .useValue({})
      .overrideProvider(PrismaOutboxPublisher)
      .useValue({ append: jest.fn() })
      .overrideProvider(CACHED_ROUTING_GEOCODER)
      .useValue({ reverseGeocode: jest.fn(async () => null) })
      .compile();

    expect(moduleRef.get(BookingReader)).toBeInstanceOf(BookingReader);
    expect(moduleRef.get(AvailableSlots)).toBeInstanceOf(AvailableSlots);
    // Клієнтське підтвердження (T-041) резолвиться з графу BookingModule
    // (контролер живе в SchedulingModule, маршрутизується як /booking/bookings).
    expect(moduleRef.get(ClientBookingsController)).toBeInstanceOf(ClientBookingsController);
    await moduleRef.close();
  });
});
