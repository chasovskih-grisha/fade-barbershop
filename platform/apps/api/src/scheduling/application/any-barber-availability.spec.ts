import { AnyBarberAvailability } from '../domain/any-barber-availability';
import { BarberSchedule, AvailabilityWindowData } from '../domain/availability';
import { OpeningHours, DayHours } from '../../locations/domain/opening-hours';
import { TimeSlotData } from '../domain/slot-validator';
import { AvailabilityRepository } from '../domain/ports';

/** Simple in‑memory fake repository for tests */
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
  /** Псевдонім для listAllByLocation з порту (fake реалізує обидва імені). */
  async listAllByLocation(locationId: string): Promise<BarberSchedule[]> {
    const result: BarberSchedule[] = [];
    for (const [key, schedule] of this.data.entries()) {
      if (key.endsWith(`:${locationId}`)) result.push(schedule);
    }
    return result;
  }
  /** Застаріле ім'я — залишено для наявних тестів. */
  async findAllByLocation(locationId: string): Promise<BarberSchedule[]> {
    return this.listAllByLocation(locationId);
  }
}

/** Helper to build OpeningHours – one open day, others closed */
function makeOpeningHours(day: number, open: string, close: string): OpeningHours {
  const days: DayHours[] = [];
  for (let i = 0; i < 7; i++) {
    if (i === day) {
      days.push({ dayOfWeek: i, open, close, closed: false });
    } else {
      days.push({ dayOfWeek: i, open: null, close: null, closed: true });
    }
  }
  return OpeningHours.of(days);
}

describe('AnyBarberAvailability', () => {
  const locationId = 'loc1';
  const day = 0; // Monday
  const opening = makeOpeningHours(day, '08:00', '20:00');
  const serviceDuration = 30; // minutes

  const windowsA: AvailabilityWindowData[] = [{ dayOfWeek: day, start: '09:00', end: '12:00' }];
  const windowsB: AvailabilityWindowData[] = [{ dayOfWeek: day, start: '13:00', end: '18:00' }];

  const barberA = BarberSchedule.create({ barberId: 'a', locationId, windows: windowsA });
  const barberB = BarberSchedule.create({ barberId: 'b', locationId, windows: windowsB });

  const repo = new FakeAvailabilityRepository();

  // Populate repository with two schedules
  beforeAll(async () => {
    await repo.save(barberA);
    await repo.save(barberB);
  });

  test('findAvailableBarbers returns matching barbers', async () => {
    const all = await repo.findAllByLocation(locationId);
    const aggregate = AnyBarberAvailability.reconstitute(locationId, all);
    const slot: TimeSlotData = { dayOfWeek: day, start: '09:15', end: '09:45' };
    const result = aggregate.findAvailableBarbers(slot, opening, serviceDuration);
    expect(result).toEqual(['a']); // only barber A available in this slot
  });

  test('no barber when slot outside all windows', async () => {
    const all = await repo.findAllByLocation(locationId);
    const aggregate = AnyBarberAvailability.reconstitute(locationId, all);
    const slot: TimeSlotData = { dayOfWeek: day, start: '12:30', end: '13:00' };
    const result = aggregate.findAvailableBarbers(slot, opening, serviceDuration);
    expect(result).toEqual([]);
  });
});

describe('AnyBarberAvailability error propagation', () => {
  test('propagates a non-slot validation error thrown by the validator', () => {
    const local = BarberSchedule.create({
      barberId: 'x',
      locationId: 'loc1',
      windows: [{ dayOfWeek: 0, start: '09:00', end: '12:00' }],
    });
    const aggregate = AnyBarberAvailability.reconstitute('loc1', [local]);
    const slot: TimeSlotData = { dayOfWeek: 0, start: '09:15', end: '09:45' };
    expect(() =>
      aggregate.findAvailableBarbers(slot, undefined as unknown as OpeningHours, 30)
    ).toThrow();
  });
});
