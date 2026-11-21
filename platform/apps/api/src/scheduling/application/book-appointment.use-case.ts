/* eslint-disable max-lines, complexity -- cohesive module (153 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 2 functions with inherent domain branching (worst: an existing definition, complexity 11 vs 10); refactor tracked in T-2500f */
import { Booking, BookingConflictError } from '../domain/booking';
import { InvalidSlotError, type TimeSlotData } from '../domain/slot-validator';
import { BarberSchedule } from '../domain/availability';
import { isDayOff } from '../domain/day-off';
import { appoint } from './appointment-spawn';
import { assertSnapshots, resolveDatedSpan } from './booking-source-rules';
import { slotFilter } from './book-appointment.slot-filter';
import { isOverDailyLimit } from './book-appointment.daily-load';
import { priceSnapshot } from './book-appointment.pricing';
import { compositionDuration } from './../domain/composed-slot-span';
import { withSpan, TRACING } from '../../shared/tracing/tracing';
import type { DepositPolicy } from '../domain/deposit-terms';
import type { ApplyDiscountResult } from '../../discounts/application/apply-discount.use-case';
import type { BookAppointmentDeps } from './book-appointment.types';

export type { BookAppointmentDeps };

/** Use‑case to book a slot for a barber (or any free barber).
 * Empty `barberId` asks the use-case to find an available scheduled barber.
 * The repository makes the chair and barber checks atomic with the write.
 * Barber leave (T-4447): barbers on leave block new bookings and appear in admin calendar.
 */

export class BookAppointment {
  constructor(private readonly deps: BookAppointmentDeps) {}

  async execute(barberId: string, locationId: string, slot: TimeSlotData): Promise<Booking> {
    // Доменний спан booking-флоу (T-4204): трейс охоплює валідацію слота і запис;
    // доменні відмови (конфлікт, невалідний слот) — ERROR-спани з винятком.
    return withSpan({
      name: TRACING.BOOKING_BOOK,
      options: {
        attributes: {
          'fade.booking.location_id': locationId,
          ...(barberId ? { 'fade.booking.barber_id': barberId } : {}),
        },
      },
      work: async () => {
        assertSnapshots(this.deps.reference, this.deps.origin);
        // Раз на запис: усі kandideti снепшотують ті самі умови (або дефолти).
        const depositPolicy = await this.deps.depositPolicy?.get();
        const slotSpan = resolveDatedSpan(slot);
        const candidates = await this.candidatesFor(barberId, locationId);

        // T-4447: Check if barber is on leave — block new bookings
        if (barberId && this.deps.dayOffs) {
          const slotDate = slotSpan.start.toISOString().slice(0, 10);
          const barberDayOffs = await this.deps.dayOffs.findByBarberId(barberId);
          if (isDayOff(barberDayOffs, slotDate)) {
            throw InvalidSlotError.of(
              barberId ? 'Barber is on leave for this date' : 'Barber is on leave'
            );
          }
        }

        let sawValidAvailability = false;
        const accepts = slotFilter(this.deps);
        // T-4520b: Handle composite slots with service positions
        const servicePositions = this.deps.servicePositions ?? [];
        const totalDuration = compositionDuration(servicePositions, 'sequential');
        const slotDuration = Math.round(
          (slotSpan.end.getTime() - slotSpan.start.getTime()) / 60000
        );

        // If total duration from service positions exceeds slot duration, reject
        if (totalDuration > slotDuration) {
          throw InvalidSlotError.of(
            barberId
              ? 'Composite slot duration exceeds available slot'
              : 'Slot too short for selected services'
          );
        }

        for (const schedule of candidates) {
          if (!accepts(schedule, slotSpan.slot)) continue;
          sawValidAvailability = true;
          if (await this.isOverDailyLimit(schedule.getBarberId(), locationId, slotSpan.start))
            continue;
          // prettier-ignore
          const booking = await this.bookIfFree({ schedule, barberId, locationId, span: slotSpan, ...(depositPolicy ? { depositPolicy } : {}) });
          if (booking) return booking;
        }
        // prettier-ignore
        if (!sawValidAvailability)
          throw InvalidSlotError.of(barberId ? 'Barber has no availability for this slot' : 'No barber is available for this slot');
        throw new BookingConflictError('No free chairs or barbers for this slot');
      },
    });
  }

  /** Явний барбер → один розклад; порожній → усі розклади локації. */
  private async candidatesFor(barberId: string, locationId: string): Promise<BarberSchedule[]> {
    // prettier-ignore
    if (barberId)
      return [await this.deps.scheduleRepo.findByBarberAndLocation(barberId, locationId)].filter((schedule): schedule is BarberSchedule => !!schedule);
    return this.deps.scheduleRepo.listAllByLocation(locationId);
  }

  /** Денний ліміт локації (T-4421): барбер з вичерпаною нормою не отримує слот. */
  private async isOverDailyLimit(
    barberId: string,
    locationId: string,
    start: Date
  ): Promise<boolean> {
    const bookings = await this.deps.bookingRepo.findForBarberAtLocation(barberId, locationId);
    return isOverDailyLimit({
      policy: this.deps.dailyLoadPolicy,
      barberId,
      start,
      load: async () => bookings.map((b) => ({ barberId: b.barberId, start: b.start })),
    });
  }

  /** T-152: знижки через ApplyDiscountService; без сервісу — знижки з `discounts`. */
  private async applyServiceDiscount(
    agreedPriceCents: number | undefined,
    start: Date
  ): Promise<ApplyDiscountResult | null> {
    const service = this.deps.discountApplication;
    if (!service || agreedPriceCents === undefined) return null;
    const serviceId = this.deps.serviceSnapshot?.serviceId;
    return service.apply({
      agreedPriceCents,
      clientId: this.deps.origin?.clientId ?? '',
      slotStart: start,
      ...(serviceId === undefined ? {} : { serviceId }),
      ...(this.deps.promoCode === undefined ? {} : { promoCode: this.deps.promoCode }),
    });
  }

  private async bookIfFree(options: {
    schedule: BarberSchedule;
    barberId: string;
    locationId: string;
    span: { start: Date; end: Date; slot: TimeSlotData };
    depositPolicy?: DepositPolicy;
  }): Promise<Booking | null> {
    const { schedule, barberId, locationId, span } = options;
    const duration = this.deps.serviceSnapshot?.agreedDuration ?? this.deps.serviceDuration;
    const start = span.start;
    const end = new Date(start.getTime() + duration * 60000);
    // prettier-ignore
    const overlaps = await this.deps.bookingRepo.findBarberOverlaps({ barberId: schedule.getBarberId(), locationId, start, end });
    if (overlaps.length) {
      if (barberId) throw new BookingConflictError('Barber is already booked for this slot');
      return null;
    }
    const priceSnap = await priceSnapshot(this.deps, start, locationId);
    const discount = await this.applyServiceDiscount(priceSnap.agreedPrice, start);
    const booking = Booking.create({
      barberId: schedule.getBarberId(),
      locationId,
      start,
      end,
      agreedDuration: duration,
      ...this.deps.serviceSnapshot,
      ...priceSnap,
      ...(discount
        ? {
            appliedDiscounts: discount.appliedDiscounts,
            requiresPayment: discount.requiresPayment,
            ...(discount.reason === undefined ? {} : { discountReason: discount.reason }),
          }
        : {}),
      ...this.deps.reference,
      ...this.deps.origin,
      ...(options.depositPolicy ? { depositPolicy: options.depositPolicy } : {}),
    });
    try {
      await this.deps.bookingRepo.save(booking);
      // Агрегат Appointment + подія booked у тій самій транзакції (T-042a).
      if (this.deps.appointmentRepo) await appoint(this.deps.appointmentRepo, booking);
      await this.openDepositHold(booking, locationId, end);
      return booking;
    } catch (error) {
      if (error instanceof BookingConflictError && !barberId) return null;
      throw error;
    }
  }

  /** T-4619a: візит, що чекає на депозит, тримає крісло 15 хвилин.
   * Безплатний візит (FinalPrice = 0, PAY-003) утримання не створює.
   */
  private async openDepositHold(booking: Booking, locationId: string, end: Date): Promise<void> {
    if (!this.deps.depositHolds) return;
    if (!booking.requiresPayment || (booking.finalPrice ?? 0) <= 0) return;
    const depositAmount = booking.deposit?.amount ?? 0;
    if (depositAmount <= 0) return;
    await this.deps.depositHolds.open({
      appointmentId: booking.id,
      barberId: booking.barberId,
      locationId,
      startAt: booking.start,
      endAt: end,
      depositAmount,
    });
  }

  /** ANL-004/REF-WEB-02: правила джерела/коментаря — booking-source-rules.ts. */
}
