import { BarberSchedule } from './availability';
import { OpeningHours } from '../../locations/domain/opening-hours';

/** TimeSlot data for validation */
export interface TimeSlotData {
  date?: string; // YYYY-MM-DD in UTC; required when persisting a booking
  dayOfWeek: number; // 0=Пн … 6=Нд
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

/** Ошибка валідації слоту */
export class InvalidSlotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSlotError';
  }

  static of(msg: string): InvalidSlotError {
    return new InvalidSlotError(msg);
  }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(t: string): number {
  const parts = t.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return h * 60 + m;
}

/** Валідатор слоту (15‑хв крок) */
export class SlotValidator {
  constructor(
    private readonly schedule: BarberSchedule,
    private readonly openingHours: OpeningHours,
    private readonly serviceDuration: number
  ) {}

  validate(slot: TimeSlotData): void {
    this.assertDayOfWeek(slot);
    const span = this.assertInterval(slot);
    this.assertInWindow(slot, span.startM, span.endM);
  }

  private assertDayOfWeek(slot: TimeSlotData): void {
    if (!Number.isInteger(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      throw InvalidSlotError.of('Invalid dayOfWeek');
    }
  }

  private assertInterval(slot: TimeSlotData): { startM: number; endM: number } {
    if (!TIME_RE.test(slot.start) || !TIME_RE.test(slot.end)) {
      throw InvalidSlotError.of('Invalid time format');
    }
    const startM = toMinutes(slot.start);
    const endM = toMinutes(slot.end);
    if (startM % 15 !== 0 || endM % 15 !== 0) {
      throw InvalidSlotError.of('Times must be on 15‑minute boundaries');
    }
    if (endM <= startM) {
      throw InvalidSlotError.of('End must be after start');
    }
    if (!Number.isInteger(this.serviceDuration) || this.serviceDuration <= 0) {
      throw InvalidSlotError.of('Invalid service duration');
    }
    if (endM - startM < this.serviceDuration) {
      throw InvalidSlotError.of('Slot shorter than service duration');
    }
    return { startM, endM };
  }

  private assertInWindow(slot: TimeSlotData, startM: number, endM: number): void {
    const dayHours = this.openingHours.days.find((d) => d.dayOfWeek === slot.dayOfWeek);
    if (!dayHours || dayHours.closed) {
      throw InvalidSlotError.of('Location closed on this day');
    }
    if (dayHours.open && dayHours.close) {
      const openM = toMinutes(dayHours.open);
      const closeM = toMinutes(dayHours.close);
      if (startM < openM || endM > closeM) {
        throw InvalidSlotError.of('Slot outside opening hours');
      }
    }
    const windows = this.schedule.getWindows().filter((w) => w.dayOfWeek === slot.dayOfWeek);
    const insideWindow = windows.some((w) => {
      const wStart = toMinutes(w.start);
      const wEnd = toMinutes(w.end);
      return startM >= wStart && endM <= wEnd;
    });
    if (!insideWindow) {
      throw InvalidSlotError.of('Slot not within any availability window');
    }
  }
}
