// Імпорти
import { uuidv7 } from '@fade/domain-shared';
import { depositTermsFor, type DepositPolicy, type DepositTerms } from './deposit-terms';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';
import type { BookingSource } from './booking-source';
import type { ServicePosition } from './composed-slot-span';

/** Канал запису (ANL-004, T-4536): канонічний набір + історичні аліаси. */
export type { BookingSource } from './booking-source';

/** Booking – запис про бронювання слоту в локації */
export interface BookingData {
  id: string;
  barberId: string;
  locationId: string;
  serviceId?: string | null;
  agreedPrice?: number | null;
  /** Снепшот застосованих знижок на момент запису (T-090, ADR 0007). */
  appliedDiscounts?: AppliedDiscount[] | null;
  /** Підсумкова ціна візиту (AgreedPrice − Σ AppliedDiscounts), ≥ 0 (DSC-004). */
  finalPrice?: number | null;
  agreedDuration?: number | null;
  fulfillmentMode?: 'sequential' | 'parallel' | null;
  start: Date;
  end: Date;
  version: number;
  /** Референс зачіски (T-043): лише ID — haircut-ai або зовнішній upload. */
  haircutReferenceId?: string | null;
  /** Коментар клієнта до візиту (T-043): plain text ≤500, валідує use case. */
  appointmentComment?: string | null;
  /** Джерело запису (T-046, ANL-004): канал; клієнт — посилання на identity/CRM. */
  clientId?: string | null;
  source?: string | null;
  /** Снепшот умов депозиту (PAY-ADM-09); null — візит без депозиту. */
  deposit?: DepositTerms | null;
  /** Чи є що платити (DSC-013): 100% знижка — візит безкоштовний. */
  requiresPayment?: boolean | null;
  /** Причина безкоштовного візиту (`full_discount_promo` тощо). */
  discountReason?: string | null;
  /** Позиції послуг у записі (T-4520a): для композитного слота. */
  servicePositions?: ServicePosition[] | null;
}

/** Параметри створення Booking (use case збирає їх зі снепшотів). */
export interface BookingCreateParams {
  barberId: string;
  locationId: string;
  start: Date;
  end: Date;
  serviceId?: string;
  agreedPrice?: number;
  /** Снепшот знижок (T-090b, ADR 0007): фіксується разом із `agreedPrice`. */
  appliedDiscounts?: AppliedDiscount[];
  /** Підсумкова ціна візиту (DSC-004); без неї — `agreedPrice` без знижок. */
  finalPrice?: number;
  agreedDuration?: number;
  fulfillmentMode?: 'sequential' | 'parallel';
  haircutReferenceId?: string;
  appointmentComment?: string;
  clientId?: string;
  /** Канал запису (ANL-004); без нього — «web». */
  source?: BookingSource;
  /**
   * Політика депозиту з адмін-налаштувань (PAY-ADM-09): з неї рахується
   * снепшот умов; без неї — дефолти політики.
   */
  depositPolicy?: DepositPolicy;
  /** Снепшот surge (T-4811): множник у базисних пунктів і id правила. */
  surgeBasisPoints?: number | null;
  surgeRuleId?: string | null;
  /** Результат T-152: чи є що платити і чому візит безкоштовний. */
  requiresPayment?: boolean;
  discountReason?: string;
  /** Позиції послуг у записі (T-4520a): для композитного слота. */
  servicePositions?: ServicePosition[];
}

/** Скалярні nullable-поля й дефолти; винесено, щоб тримати складність низькою. */
function basicOptionalFields(params: BookingCreateParams) {
  return {
    serviceId: params.serviceId ?? null,
    agreedPrice: params.agreedPrice ?? null,
    appliedDiscounts: params.appliedDiscounts ?? null,
    source: params.source ?? 'web',
  };
}

function surgeOptionalFields(params: BookingCreateParams) {
  return {
    fulfillmentMode: params.fulfillmentMode ?? null,
    haircutReferenceId: params.haircutReferenceId ?? null,
    appointmentComment: params.appointmentComment ?? null,
    clientId: params.clientId ?? null,
    surgeBasisPoints: params.surgeBasisPoints ?? null,
    surgeRuleId: params.surgeRuleId ?? null,
    requiresPayment: params.requiresPayment ?? null,
    discountReason: params.discountReason ?? null,
  };
}

/** Формування об'єкта даних для створення нової угоди. */
export function newBookingData(params: BookingCreateParams): BookingData {
  if (params.end <= params.start) throw new Error('Booking end must be after start');
  return {
    id: uuidv7(),
    barberId: params.barberId,
    locationId: params.locationId,
    start: params.start,
    end: params.end,
    version: 0,
    agreedDuration: resolveDuration(params),
    deposit: resolveDeposit(params),
    ...basicOptionalFields(params),
    ...surgeOptionalFields(params),
    finalPrice: resolveFinalPrice(params),
    servicePositions: params.servicePositions ?? undefined,
  };
}

/** Скалярні nullable-поля й дефолти; винесено, щоб тримати складкість низькою. */
function resolveDuration(params: BookingCreateParams): number {
  return (
    params.agreedDuration ?? Math.round((params.end.getTime() - params.start.getTime()) / 60000)
  );
}

/**
 * Снепшот умов депозиту (PAY-ADM-09, T-160): рахується від підсумкової ціни
 * візиту, тож 100% зничка (FinalPrice = 0) дає `null` — без Payment і чека
 * (DSC-013), а депозит вимкнений політикою теж не створюється.
 */
function resolveDeposit(params: BookingCreateParams): DepositTerms | null {
  const price = params.finalPrice ?? params.agreedPrice;
  return depositTermsFor(price, params.depositPolicy);
}

/** Розрахунок кінцеової ціни з урахуванням знижок. */
function resolveFinalPrice(params: BookingCreateParams): number | null {
  const agreedPrice = params.agreedPrice;
  if (agreedPrice == null) return null; // null або undefined → null (T-090: без snapshots)
  const discountSum = (params.appliedDiscounts ?? [])
    .map((d) => d.amount ?? 0)
    .reduce((sum, amt) => sum + amt, 0);
  return Math.max(0, agreedPrice - discountSum);
}