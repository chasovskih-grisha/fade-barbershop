// Типи use-case BookAppointment — окремо від класу: форма залежностей і
// опцій без залежності від реалізації.
import type { BarberSchedule } from '../domain/availability';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import type { AppointmentRepository } from '../domain/appointment-repository';
import type { BookingRepository } from '../domain/booking-repository';
import type { BookingSource } from '../domain/booking.data';
import type { DailyLoadPolicy } from '../domain/daily-load-limit';
import type { DepositPolicySettingsPort } from '../domain/deposit-policy-settings';
import type { DiscountInput } from '../../discounts/domain/discount-calculator';
import type { ServicePosition } from '../domain/composed-slot-span';

export interface BookAppointmentDeps {
  bookingRepo: BookingRepository;
  scheduleRepo: {
    findByBarberAndLocation(barberId: string, locationId: string): Promise<BarberSchedule | null>;
    listAllByLocation(locationId: string): Promise<BarberSchedule[]>;
  };
  openingHours: OpeningHours;
  serviceDuration: number;
  /** Агрегат Appointment + подія booked в outbox (T-042a); за наявності. */
  appointmentRepo?: AppointmentRepository;
  // prettier-ignore
  serviceSnapshot?: { serviceId: string; agreedPrice: number; agreedDuration?: number; fulfillmentMode?: 'sequential' | 'parallel' };
  /** Складові послуги композитного слота (T-4520a/b). */
  servicePositions?: ServicePosition[];
  /**
   * Знижки при записі (T-090, ADR 0007): клієнт + слот + послуга + промокод.
   * `DiscountCalculator` застосовується в use case і снепшотиться на Booking.
   */
  discounts?: Omit<DiscountInput, 'agreedPrice'>;
  /** Референс/коментар (T-043): снепшот на записі при створенні. */
  reference?: { haircutReferenceId?: string; appointmentComment?: string };
  /** Джерело запису (T-046, ANL-004): канал + посилання на клієнта. */
  origin?: { clientId?: string; source?: BookingSource };
  /** Обмеження денного навантаження (T-4421): політика локації; за відсутності — без ліміту. */
  dailyLoadPolicy?: DailyLoadPolicy;
  /**
   * Політика депозиту (PAY-ADM-09) з адмін-налаштувань: читається один раз на
   * запис і снепшотиться на Booking; за відсутності — дефолти PAY-ADM-09.
   */
  depositPolicy?: DepositPolicySettingsPort;
  /**
   * Surge-ціноутворення (T-4811): множник до базової ціни слота; множник
   * фіксується на Booking. Без порту — ціна без surge.
   */
  surge?: {
    quote(input: { locationId: string; start: Date; basePrice: number }): Promise<{
      price: number;
      multiplierBp: number;
      ruleId: string | null;
    }>;
  };
}
