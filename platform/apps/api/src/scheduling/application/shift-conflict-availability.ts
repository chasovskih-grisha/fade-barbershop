// T-4616a: перевірка «чи є інший барбер» для списку конфліктів. Використовує
// ту саму матрицю барбер×послуга, графік, години локації та перевірку зайнятості,
// що й запис/перенесення, тому відповідь не розходиться з валідацією слота.
import { barbersForService } from '../domain/barber-service-matrix';
import { dayOfWeekFor } from '../domain/day-of-week';
import { SlotValidator } from '../domain/slot-validator';
import type { BarberSchedule } from '../domain/availability';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import type { BarberServiceAssignmentRepository } from '../domain/ports.barber-service-assignment';
import type { BarberUnavailabilityRepository } from '../domain/shift-conflict-ports';
import type { BookingRepository } from '../domain/booking-repository';
import type { ShiftConflictAvailability } from '../domain/shift-conflict-ports';
import type { ShiftConflictData } from '../domain/barber-unavailability';

export interface ShiftConflictAvailabilityDeps {
  schedules: { listAllByLocation(locationId: string): Promise<BarberSchedule[]> };
  locations: { findById(id: string): Promise<{ hours: OpeningHours } | null> };
  bookings: Pick<BookingRepository, 'findBarberOverlaps'>;
  unavailabilities: Pick<BarberUnavailabilityRepository, 'covers'>;
  barberServices: Pick<BarberServiceAssignmentRepository, 'snapshotForLocation'>;
}

export class SchedulingShiftConflictAvailability implements ShiftConflictAvailability {
  constructor(private readonly deps: ShiftConflictAvailabilityDeps) {}

  async hasOtherBarber(conflict: ShiftConflictData): Promise<boolean> {
    const location = await this.deps.locations.findById(conflict.locationId);
    if (!location) return false;
    const others = (await this.deps.schedules.listAllByLocation(conflict.locationId)).filter(
      (schedule) => schedule.getBarberId() !== conflict.barberId
    );
    if (others.length === 0) return false;
    const othersIds = others.map((schedule) => schedule.getBarberId());

    // Той самий фільтр кваліфікації, що й у переносі; без послуги — усі, хто має графік.
    const qualified = conflict.serviceId
      ? barbersForService(
          (await this.deps.barberServices.snapshotForLocation(conflict.locationId)).matrix,
          { locationId: conflict.locationId, serviceId: conflict.serviceId },
          othersIds
        )
      : new Set(othersIds);

    const slot = slotOf(conflict);
    const duration = Math.round((conflict.end.getTime() - conflict.start.getTime()) / 60000);
    for (const schedule of others) {
      const barberId = schedule.getBarberId();
      if (!qualified.has(barberId)) continue;
      try {
        new SlotValidator(schedule, location.hours, duration).validate(slot);
      } catch {
        continue;
      }
      if (
        await this.deps.unavailabilities.covers({
          barberId,
          locationId: conflict.locationId,
          start: conflict.start,
          end: conflict.end,
        })
      ) {
        continue;
      }
      const overlaps = await this.deps.bookings.findBarberOverlaps({
        barberId,
        locationId: conflict.locationId,
        start: conflict.start,
        end: conflict.end,
      });
      if (overlaps.length === 0) return true;
    }
    return false;
  }
}

function slotOf(conflict: ShiftConflictData) {
  const date = conflict.start.toISOString().slice(0, 10);
  return {
    date,
    dayOfWeek: dayOfWeekFor(date),
    start: hhmm(conflict.start),
    end: hhmm(conflict.end),
  };
}

function hhmm(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}
