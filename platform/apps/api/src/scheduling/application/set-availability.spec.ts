import { SetAvailabilityHandler } from './set-availability';
import { FakeOutbox, passthroughUow } from '../../locations/application/ports.fakes';
import { InvalidScheduleInputError, ScheduleConflictError } from './availability-errors';
import { AvailabilityWindowData } from '../domain/availability';
import { createLocation } from '../../locations/test-helpers.fakes';
import { FakeAvailabilityRepository } from './set-availability.fakes';

describe('SetAvailabilityHandler', () => {
  let repo: FakeAvailabilityRepository;
  let outbox: FakeOutbox;
  const uow = passthroughUow;
  let handler: SetAvailabilityHandler;

  beforeEach(() => {
    repo = new FakeAvailabilityRepository();
    outbox = new FakeOutbox();
    handler = new SetAvailabilityHandler({
      scheduleRepo: repo,
      locations: {
        findById: async (id: string) => (id === 'loc1' ? createLocation({ id }) : null),
      } as never,
      bookings: { findForBarberAtLocation: async () => [] },
      outbox,
      uow,
    });
  });

  test('successfully sets availability', async () => {
    const windows: AvailabilityWindowData[] = [
      { dayOfWeek: 1, start: '09:00', end: '12:00' },
      { dayOfWeek: 2, start: '13:00', end: '17:00' },
    ];
    const result = await handler.handle({ barberId: 'b1', locationId: 'loc1', windows });
    expect(result.version).toBe(0);
    expect(outbox.events).toHaveLength(1);
    const event = outbox.events[0];
    expect(event?.type).toBe('scheduling.availability.changed');
    expect(event?.payload).toMatchObject({
      barberId: 'b1',
      locationId: 'loc1',
      windows,
      version: 0,
    });
    const stored = await repo.findByBarberAndLocation('b1', 'loc1');
    expect(stored).not.toBeNull();
    expect(stored?.getVersion()).toBe(0);
  });

  test('increments schedule version on every update', async () => {
    const windows: AvailabilityWindowData[] = [{ dayOfWeek: 1, start: '09:00', end: '12:00' }];
    await handler.handle({ barberId: 'b1', locationId: 'loc1', windows });
    const updated = await handler.handle({ barberId: 'b1', locationId: 'loc1', windows });
    expect(updated.version).toBe(1);
  });

  test('throws on missing barberId', async () => {
    const windows: AvailabilityWindowData[] = [{ dayOfWeek: 1, start: '09:00', end: '12:00' }];
    await expect(
      handler.handle({ barberId: '', locationId: 'loc1', windows })
    ).rejects.toBeInstanceOf(InvalidScheduleInputError);
  });

  test('throws on too many windows per day', async () => {
    const windows: AvailabilityWindowData[] = [
      { dayOfWeek: 1, start: '09:00', end: '11:00' },
      { dayOfWeek: 1, start: '12:00', end: '14:00' },
      { dayOfWeek: 1, start: '15:00', end: '17:00' },
    ];
    await expect(
      handler.handle({ barberId: 'b1', locationId: 'loc1', windows })
    ).rejects.toBeInstanceOf(ScheduleConflictError);
  });

  test('throws on overlapping windows', async () => {
    const windows: AvailabilityWindowData[] = [
      { dayOfWeek: 2, start: '09:00', end: '13:00' },
      { dayOfWeek: 2, start: '12:00', end: '15:00' },
    ];
    await expect(
      handler.handle({ barberId: 'b1', locationId: 'loc1', windows })
    ).rejects.toBeInstanceOf(ScheduleConflictError);
  });
});
