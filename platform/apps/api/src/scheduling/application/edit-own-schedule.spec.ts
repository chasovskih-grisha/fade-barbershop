import { Booking } from '../domain/booking';
import type { AvailabilityWindowData } from '../domain/availability';
import { ScheduleNotAllowedError } from '../domain/barber-self-service';
import { EditOwnScheduleHandler } from './edit-own-schedule';
import { FakeOutbox, passthroughUow } from '../../locations/application/ports.fakes';
import { createLocation } from '../../locations/test-helpers.fakes';
import { FakeAvailabilityRepository, FakeScheduleChangeLogRepository, FakeSchedulePolicyRepository } from './set-availability.fakes';

const window: AvailabilityWindowData = { dayOfWeek: 0, start: '10:00', end: '12:00' };
const barber = {
  policy: { selfService: true, allowOutsideHours: false },
  source: 'barber' as const,
};

function visit(id = 'bk-1'): Booking {
  return Booking.reconstitute({
    id,
    barberId: 'b1',
    locationId: 'loc1',
    serviceId: 'svc-1',
    clientId: 'cl-1',
    start: new Date('2026-09-28T10:00:00Z'),
    end: new Date('2026-09-28T10:30:00Z'),
    version: 0,
  });
}

function build(bookings: Booking[] = [], delegated = true) {
  const scheduleRepo = new FakeAvailabilityRepository();
  const policies = new FakeSchedulePolicyRepository();
  if (delegated) policies.set('b1', { selfService: true, allowOutsideHours: false });
  const changeLog = new FakeScheduleChangeLogRepository();
  const outbox = new FakeOutbox();
  const findById = async (id: string) => (id === 'loc1' ? createLocation({ id }) : null);
  const handler = new EditOwnScheduleHandler({
    scheduleRepo,
    policies,
    changeLog,
    locations: { findById } as never,
    bookings: { findForBarberAtLocation: async () => bookings },
    outbox,
    uow: passthroughUow,
  });
  return { handler, scheduleRepo, changeLog, outbox };
}

describe('EditOwnScheduleHandler (T-230)', () => {
  const edit = (windows: AvailabilityWindowData[]) => ({
    barberId: 'b1',
    locationId: 'loc1',
    windows,
    editor: barber,
    changedBy: 'barber-1',
  });

  it('blocks a barber whose self-service is not delegated (SCH-001)', async () => {
    const { handler } = build([], false);
    await expect(handler.handle(edit([window]))).rejects.toBeInstanceOf(ScheduleNotAllowedError);
  });

  it('saves a delegated edit, logging the source and emitting the event (SCH-006/008)', async () => {
    const { handler, scheduleRepo, changeLog, outbox } = build();
    const result = await handler.handle(edit([window]));
    expect(result).toEqual({ status: 'saved', version: 0 });
    expect(await scheduleRepo.findByBarberAndLocation('b1', 'loc1')).not.toBeNull();
    expect(changeLog.changes[0]).toMatchObject({
      barberId: 'b1',
      source: 'barber',
      changedBy: 'barber-1',
    });
    expect(outbox.events[0]?.payload).toMatchObject({ source: 'barber', version: 0 });
  });

  it('blocks the save and reports conflicts without touching the schedule (SCH-004)', async () => {
    const { handler, scheduleRepo, changeLog, outbox } = build([visit()]);
    const result = await handler.handle(edit([{ dayOfWeek: 0, start: '09:00', end: '10:00' }]));
    expect(result).toEqual({
      status: 'blocked',
      conflicts: [
        { bookingId: 'bk-1', clientId: 'cl-1', serviceId: 'svc-1', start: '10:00', end: '10:30' },
      ],
    });
    expect(await scheduleRepo.findByBarberAndLocation('b1', 'loc1')).toBeNull();
    expect(changeLog.changes).toHaveLength(0);
    expect(outbox.events).toHaveLength(0);
  });

  it('keeps a delegated window strictly inside opening hours (SCH-003)', async () => {
    const { handler } = build();
    await expect(
      handler.handle(edit([{ dayOfWeek: 0, start: '08:00', end: '09:00' }]))
    ).rejects.toBeInstanceOf(ScheduleNotAllowedError);
  });
});
