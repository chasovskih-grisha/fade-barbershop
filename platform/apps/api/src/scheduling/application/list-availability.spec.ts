import { ListAvailabilityHandler } from './set-availability';
import { BarberSchedule } from '../domain/availability';
import { FakeAvailabilityRepository } from './set-availability.fakes';

describe('ListAvailabilityHandler', () => {
  let repo: FakeAvailabilityRepository;
  let handler: ListAvailabilityHandler;

  beforeEach(() => {
    repo = new FakeAvailabilityRepository();
    handler = new ListAvailabilityHandler({ scheduleRepo: repo });
  });

  test('returns null when schedule missing', async () => {
    const result = await handler.listByBarberAndLocation('b2', 'loc2');
    expect(result).toBeNull();
  });

  test('returns stored schedule', async () => {
    const schedule = BarberSchedule.create({
      barberId: 'b3',
      locationId: 'loc3',
      windows: [{ dayOfWeek: 3, start: '10:00', end: '12:00' }],
    });
    await repo.save(schedule);
    const result = await handler.listByBarberAndLocation('b3', 'loc3');
    expect(result).not.toBeNull();
    expect(result?.getBarberId()).toBe('b3');
  });
});
