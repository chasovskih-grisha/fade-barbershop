import { performance } from 'perf_hooks';
import {
  BarberSchedule,
  AvailabilityWindowData,
} from '../apps/api/src/scheduling/domain/availability';
import { SlotValidator, TimeSlotData } from '../apps/api/src/scheduling/domain/slot-validator';
import { OpeningHours } from '../apps/api/src/locations/domain/opening-hours';

/** Simple benchmark: validate a slot for many barbers */
function generateSchedules(count: number): BarberSchedule[] {
  const windows: AvailabilityWindowData[] = [{ dayOfWeek: 0, start: '08:00', end: '20:00' }];
  const schedules: BarberSchedule[] = [];
  for (let i = 0; i < count; i++) {
    schedules.push(BarberSchedule.create({ barberId: `b${i}`, locationId: 'loc1', windows }));
  }
  return schedules;
}

const BARBER_COUNT = Number(process.env.BARBER_COUNT) || 500;
const schedules = generateSchedules(BARBER_COUNT);
const opening = OpeningHours.of(
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    open: '08:00',
    close: '20:00',
    closed: false,
  }))
);
const serviceDuration = 30; // minutes
const slot: TimeSlotData = { dayOfWeek: 0, start: '09:15', end: '09:45' };

const start = performance.now();
for (const schedule of schedules) {
  new SlotValidator(schedule, opening, serviceDuration).validate(slot);
}
const elapsed = performance.now() - start;
console.log(
  `Validated ${BARBER_COUNT} schedules in ${elapsed.toFixed(2)} ms (${(elapsed / BARBER_COUNT).toFixed(2)} ms per schedule)`
);
