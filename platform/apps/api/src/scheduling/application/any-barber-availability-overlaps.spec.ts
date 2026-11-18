// T-040b: перетини графіків барберів і «вільний у когось одного».
// Агрегат «Будь-який барбер» повертає всіх барберів, чиє вікно покриває слот.
import { AnyBarberAvailability } from '../domain/any-barber-availability';
import { BarberSchedule, AvailabilityWindowData } from '../domain/availability';
import { OpeningHours, DayHours } from '../../locations/domain/opening-hours';
import { TimeSlotData } from '../domain/slot-validator';

const DAY = 0; // Monday
const SERVICE_DURATION = 30;

function makeOpeningHours(day: number, open: string, close: string): OpeningHours {
  const days: DayHours[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(
      i === day
        ? { dayOfWeek: i, open, close, closed: false }
        : { dayOfWeek: i, open: null, close: null, closed: true }
    );
  }
  return OpeningHours.of(days);
}

const schedule = (barberId: string, windows: AvailabilityWindowData[]) =>
  BarberSchedule.create({ barberId, locationId: 'loc1', windows });

const aggregateOf = (...schedules: BarberSchedule[]) =>
  AnyBarberAvailability.reconstitute('loc1', schedules);

const opening = makeOpeningHours(DAY, '08:00', '20:00');
const slot = (start: string, end: string): TimeSlotData => ({ dayOfWeek: DAY, start, end });

describe('AnyBarberAvailability: перетини графіків (T-040b)', () => {
  const morning = schedule('a', [{ dayOfWeek: DAY, start: '09:00', end: '12:00' }]);
  const morningToo = schedule('b', [{ dayOfWeek: DAY, start: '10:00', end: '13:00' }]);
  const afternoon = schedule('c', [{ dayOfWeek: DAY, start: '14:00', end: '18:00' }]);

  it('перетин двох графіків: слот віддає обом барберам', () => {
    const aggregate = aggregateOf(morning, morningToo, afternoon);
    expect(
      aggregate.findAvailableBarbers(slot('10:15', '10:45'), opening, SERVICE_DURATION)
    ).toEqual(['a', 'b']);
  });

  it('слот поза перетином лишає лише одного', () => {
    const aggregate = aggregateOf(morning, morningToo, afternoon);
    expect(
      aggregate.findAvailableBarbers(slot('12:15', '12:45'), opening, SERVICE_DURATION)
    ).toEqual(['b']);
  });

  it('«вільний у когось одного»: ранковий слот віддає лише a', () => {
    const aggregate = aggregateOf(morning, morningToo, afternoon);
    expect(
      aggregate.findAvailableBarbers(slot('09:00', '09:30'), opening, SERVICE_DURATION)
    ).toEqual(['a']);
  });

  it('жодне вікно не покриває слот — порожній результат', () => {
    const aggregate = aggregateOf(morning, morningToo, afternoon);
    expect(
      aggregate.findAvailableBarbers(slot('13:00', '13:30'), opening, SERVICE_DURATION)
    ).toEqual([]);
  });

  it('два барбери з тим самим вікном обидва доступні', () => {
    const twin = schedule('d', [{ dayOfWeek: DAY, start: '09:00', end: '12:00' }]);
    const aggregate = aggregateOf(morning, twin);
    expect(
      aggregate.findAvailableBarbers(slot('09:15', '09:45'), opening, SERVICE_DURATION)
    ).toEqual(['a', 'd']);
  });
});
