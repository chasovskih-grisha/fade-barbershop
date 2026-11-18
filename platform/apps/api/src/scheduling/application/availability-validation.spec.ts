import { Booking } from '../domain/booking';
import { AvailabilityWindowData } from '../domain/availability';
import { createLocation } from '../../locations/test-helpers.fakes';
import { ScheduleConflictError, InvalidScheduleInputError } from './availability-errors';
import { validateAvailability } from './availability-validation';

const opening = createLocation({ id: 'loc-1' }).hours;
const window: AvailabilityWindowData = { dayOfWeek: 0, start: '09:00', end: '17:00' };

describe('validateAvailability', () => {
  it('accepts windows inside location opening hours', () => {
    expect(() => validateAvailability([window], opening, [])).not.toThrow();
  });

  it('rejects malformed windows and hours outside the location opening time', () => {
    expect(() => validateAvailability([{ ...window, start: '9:00' }], opening, [])).toThrow(
      InvalidScheduleInputError
    );
    expect(() => validateAvailability([{ ...window, start: '08:00' }], opening, [])).toThrow(
      InvalidScheduleInputError
    );
  });

  it('rejects a schedule update that would strand a booked appointment', () => {
    const booking = Booking.reconstitute({
      id: 'booking-1',
      barberId: 'barber-1',
      locationId: 'loc-1',
      start: new Date('2026-09-28T10:00:00Z'),
      end: new Date('2026-09-28T10:30:00Z'),
      version: 0,
    });
    expect(() => validateAvailability([{ ...window, end: '10:00' }], opening, [booking])).toThrow(
      ScheduleConflictError
    );
  });
});
