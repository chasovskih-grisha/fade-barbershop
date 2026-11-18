import { SetAvailabilityHandler } from './set-availability';
import { FakeOutbox, passthroughUow } from '../../locations/application/ports.fakes';
import { InvalidScheduleInputError } from './availability-errors';
import { BarberSchedule } from '../domain/availability';
import { AvailabilityRepository } from '../domain/ports';
import { LocationNotFoundError } from '../../locations/application/locations-errors';
import { createLocation } from '../../locations/test-helpers.fakes';

class FakeAvailabilityRepository implements AvailabilityRepository {
  private data: Map<string, BarberSchedule> = new Map();
  async findByBarberAndLocation(
    barberId: string,
    locationId: string
  ): Promise<BarberSchedule | null> {
    return this.data.get(`${barberId}:${locationId}`) ?? null;
  }
  async save(schedule: BarberSchedule): Promise<void> {
    this.data.set(`${schedule.getBarberId()}:${schedule.getLocationId()}`, schedule);
  }
  async listAllByLocation(locationId: string): Promise<BarberSchedule[]> {
    return Array.from(this.data.entries())
      .filter(([key]) => key.endsWith(`:${locationId}`))
      .map(([, s]) => s);
  }
}

describe('SetAvailabilityHandler guards', () => {
  let repo: FakeAvailabilityRepository;
  let outbox: FakeOutbox;
  let handler: SetAvailabilityHandler;

  beforeEach(() => {
    repo = new FakeAvailabilityRepository();
    outbox = new FakeOutbox();
    handler = new SetAvailabilityHandler({
      scheduleRepo: repo,
      locations: {
        findById: async (id: string) => {
          if (id !== 'loc1') return null;
          const loc = createLocation({ id });
          loc.setActive(false);
          return loc;
        },
      } as never,
      bookings: { findForBarberAtLocation: async () => [] },
      outbox,
      uow: passthroughUow,
    });
  });

  test('throws when windows is not an array', async () => {
    await expect(
      handler.handle({ barberId: 'b1', locationId: 'loc1', windows: 'x' as never })
    ).rejects.toBeInstanceOf(InvalidScheduleInputError);
  });

  test('throws when location is missing', async () => {
    const handler2 = new SetAvailabilityHandler({
      scheduleRepo: repo,
      locations: { findById: async () => null } as never,
      bookings: { findForBarberAtLocation: async () => [] },
      outbox,
      uow: passthroughUow,
    });
    const windows = [{ dayOfWeek: 1, start: '09:00', end: '12:00' }];
    await expect(
      handler2.handle({ barberId: 'b1', locationId: 'missing', windows })
    ).rejects.toBeInstanceOf(LocationNotFoundError);
  });

  test('throws when location is inactive', async () => {
    const windows = [{ dayOfWeek: 1, start: '09:00', end: '12:00' }];
    await expect(
      handler.handle({ barberId: 'b1', locationId: 'loc1', windows })
    ).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
