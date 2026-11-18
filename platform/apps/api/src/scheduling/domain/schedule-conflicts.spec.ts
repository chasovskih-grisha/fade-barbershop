import { Booking } from './booking';
import type { AvailabilityWindowData } from './availability';
import { findScheduleConflicts } from './schedule-conflicts';

const window: AvailabilityWindowData = { dayOfWeek: 0, start: '09:00', end: '17:00' };

function booking(start: string, end: string, id = 'booking-1'): Booking {
  return Booking.reconstitute({
    id,
    barberId: 'barber-1',
    locationId: 'loc-1',
    serviceId: 'service-1',
    clientId: 'client-1',
    start: new Date(start),
    end: new Date(end),
    version: 0,
  });
}

describe('findScheduleConflicts (SCH-004)', () => {
  it('reports no conflict when the window still covers the visit', () => {
    expect(
      findScheduleConflicts([window], [booking('2026-09-28T10:00:00Z', '2026-09-28T10:30:00Z')])
    ).toEqual([]);
  });

  it('reports a conflict when the visit is stranded, without cancelling it', () => {
    const visits = [booking('2026-09-28T10:00:00Z', '2026-09-28T10:30:00Z')];
    const conflicts = findScheduleConflicts([{ ...window, end: '10:00' }], visits);
    expect(conflicts).toEqual([
      {
        bookingId: 'booking-1',
        clientId: 'client-1',
        serviceId: 'service-1',
        start: '10:00',
        end: '10:30',
      },
    ]);
    expect(visits[0]?.end).toEqual(new Date('2026-09-28T10:30:00Z'));
  });

  it('reports a visit on a weekday with no window as a conflict', () => {
    const conflicts = findScheduleConflicts(
      [window],
      [booking('2026-09-29T10:00:00Z', '2026-09-29T10:30:00Z')]
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.bookingId).toBe('booking-1');
  });
});
