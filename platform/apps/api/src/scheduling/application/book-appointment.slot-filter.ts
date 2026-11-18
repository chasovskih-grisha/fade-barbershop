// Фільтр кандидатів за слотом (ANL-004): невалідний слот відсіює розклад,
// інші помилки — прокидаються. Спільний для book-appointment use case.
import type { BarberSchedule } from '../domain/availability';
import { SlotValidator, InvalidSlotError, type TimeSlotData } from '../domain/slot-validator';
import type { OpeningHours } from '../../locations/domain/opening-hours';

export function slotFilter(deps: { openingHours: OpeningHours; serviceDuration: number }) {
  return (schedule: BarberSchedule, slot: TimeSlotData): boolean => {
    try {
      new SlotValidator(schedule, deps.openingHours, deps.serviceDuration).validate(slot);
      return true;
    } catch (error) {
      if (error instanceof InvalidSlotError) return false;
      throw error;
    }
  };
}
