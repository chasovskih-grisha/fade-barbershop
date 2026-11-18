import { BarberSchedule } from './availability';
import { OpeningHours } from '../../locations/domain/opening-hours';
import { SlotValidator, InvalidSlotError, TimeSlotData } from './slot-validator';

/** Aggregатор доступності будь‑якого барбера у локації */
export class AnyBarberAvailability {
  private constructor(
    private readonly locationId: string,
    private readonly schedules: readonly BarberSchedule[]
  ) {}

  static reconstitute(locationId: string, schedules: BarberSchedule[]): AnyBarberAvailability {
    return new AnyBarberAvailability(locationId, schedules);
  }

  /**
   * Повертає ідентифікатори барберів, які можуть обслуговувати заданий слот.
   * Якщо слот не валідний (наприклад, не в межах `OpeningHours` чи `AvailabilityWindow`),
   * просто пропускаємо відповідного барбера.
   */
  findAvailableBarbers(
    slot: TimeSlotData,
    openingHours: OpeningHours,
    serviceDuration: number
  ): string[] {
    const available: string[] = [];
    for (const schedule of this.schedules) {
      const validator = new SlotValidator(schedule, openingHours, serviceDuration);
      try {
        validator.validate(slot);
        available.push(schedule.getBarberId());
      } catch (e) {
        if (e instanceof InvalidSlotError) {
          // slot not available for this barber – ignore
        } else {
          throw e;
        }
      }
    }
    return available;
  }
}
