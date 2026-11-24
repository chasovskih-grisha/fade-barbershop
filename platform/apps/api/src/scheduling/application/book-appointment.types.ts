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
import type { ApplyDiscountInput, ApplyDiscountResult } from '../../discounts/application/apply-discount.use-case';
import type { SlotDemandRecord, SlotCongestionOptimizerConfig, SlotCongestionResult } from '../domain/slot-congestion-optimizer';
import type { OpenShift, ShiftTemplate, ShiftBiddingResult, ShiftChangeRequest, BarberShiftAvailability, DemandOverlay } from '../domain/shift-bidding-types';

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
  /** Знитки при записі (T-090, ADR 0007): клієнт + слот + послуга + промокод.
   * `DiscountCalculator` застосовується в use case і снепшотиться на Booking.
   */
  discounts?: Omit<DiscountInput, 'agreedPrice'>;
  /** Складений слот (T-4520b): позиції послуг у межах одного візиту.
   * За відсутності — звичайний односервісний запис.
   */
  servicePositions?: ServicePosition[];
  /** Сервіс знижок (T-152): рахує знижки від ціни слота і повертає розклад
   * (ADR 0006/0007). Без нього — знижки лише з `discounts`.
   */
  discountApplication?: { apply(input: ApplyDiscountInput): Promise<ApplyDiscountResult> };
  /** Сирий промокод від клієнта; недійсний код запис не блокує (DSC-WEB-03). */
  promoCode?: string;
  /** Референс/коментар (T-043): снепшот на записі при створенні. */
  reference?: { haircutReferenceId?: string; appointmentComment?: string };
  /** Джерело запису (T-046, ANL-004): канал + посилання на клієнта. */
  origin?: { clientId?: string; source?: BookingSource };
  /** Обмеження денного навантаження (T-4421): політика локації; за відсутності — без ліміту. */
  dailyLoadPolicy?: DailyLoadPolicy;
  /** Політика депозиту (PAY-ADM-09) з адмін-налаштувань: читається один раз на
   * запис і снепшотиться на Booking; за відсутності — дефолти PAY-ADM-09.
   */
  depositPolicy?: DepositPolicySettingsPort;
  /** T-4619a: тримає крісло під незаплачений депозит одразу після запису.
   * Без порту — запис без утримання (як до T-4619a).
   */
  depositHolds?: {
    open(input: {
      appointmentId: string;
      barberId: string;
      locationId: string;
      startAt: Date;
      endAt: Date;
      depositAmount: number;
    }): Promise<unknown>;
  };
  /** Surge-ціноутворення (T-4811): множник до базової ціни слота; множник
   * фіксується на Booking. Без порту — ціна без surge.
   */
  surge?: {
    quote(input: { locationId: string; start: Date; basePrice: number }): Promise<{
      price: number;
      multiplierBp: number;
      ruleId: string | null;
    }>;
  };
  /** Оптимізатор конгежованності слотів (T-5011): реальний час eng demand-based multipliers. */
  slotCongestionOptimizer?: {
    optimizeSlotCongestion(records: SlotDemandRecord[], config: SlotCongestionOptimizerConfig): SlotCongestionResult[];
  };
  /** Репозиторій днів відрядження барбера (T-4447). */
  dayOffs?: import('../domain/day-off').DayOffRepository;
  /** T-4616a: інтервали, на які барбер позначений недоступним. */
  unavailable?: Pick<import('../domain/shift-conflict-ports').BarberUnavailabilityRepository, 'covers'>;
  /** Оптимізатор змінової біржування та розкладу (T-5012): динамічний графік та marketplace для зміни слотів. */
  shiftBiddingOptimizer?: {
    optimizeShiftBidding(openShifts: OpenShift[], barberAvailabilities: BarberShiftAvailability[], demandOverlay?: DemandOverlay): ShiftBiddingResult;
    createShiftChangeRequest(input: { id: string; appointmentId: string; clientId: string; currentSlot: { date: string; start: string; end: string }; requestedSlot?: { date: string; start: string; end: string }; at?: Date }): ShiftChangeRequest;
    approveShiftChangeRequest(request: ShiftChangeRequest, input: { by: string; slot?: { date: string; start: string; end: string; }; at?: Date }): ShiftChangeRequest;
    rejectShiftChangeRequest(request: ShiftChangeRequest, input: { by: string; reason: string }): ShiftChangeRequest;
    confirmShiftChangeAgreement(request: ShiftChangeRequest, input: { clientId: string; eventId: string; at?: Date; slotTaken?: boolean }): { request: ShiftChangeRequest; alreadyConfirmed: boolean };
  };
  /** Те шаблони зміни графіка (T-5012). */
  shiftTemplates?: {
    listAllByLocation(locationId: string): Promise<ShiftTemplate[]>;
    findById(templateId: string): Promise<ShiftTemplate | null>;
  };
}