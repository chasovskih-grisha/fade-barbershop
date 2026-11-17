// Імпорти
import { uuidv7 } from '@fade/domain-shared';
import { depositTermsFor, type DepositPolicy, type DepositTerms } from './deposit-terms';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';
import type { BookingSource } from './booking-source';
import type { ServicePosition } from './composed-slot-span';
import type { PaymentStatus } from './payment-status';

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
  /** Статус оплаты депозиту (T-091): этапиLifecycle. */
  depositStatus?: PaymentStatus | null;
  /** Сума депозиту, оплаченого на записі. */
  depositAmount?: number | null;
  /** Статус оплаты на місці (T-093): initiated/captured/failed. */
  paymentStatus?: PaymentStatus | null;
  /** Дата оплати на місці (T-093). */
  onsitePaymentDate?: Date | null;
  /** Сума restantes/change (T-093): FinalPrice - depositAmount. */
  changeAmount?: number | null;
  /** Статус no-show (T-095): автоматичне оновлення після 24гх. */
  noShowStatus?: 'none' | 'pending' | 'escalated' | 'confirmed' | null;
  /** Час escalation no-show (T-095): +24гх після missed slot. */
  noShowEscalatedAt?: Date | null;
  /** ID вернення при no-show (T-095): для ідемпотентності та аудиту. */
  noShowRefundId?: string | null;
  /** Статус оплати на місці (T-093): initiated/captured/failed. */
  paymentStatus?: PaymentStatus | null;
  /** Дата оплати на місці (T-093). */
  onsitePaymentDate?: Date | null;
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
  /** Снепшот surge (T-4811): множник у базисних пунктів і id правила. */
  surgeBasisPoints?: number | null;
  surgeRuleId?: string | null;
  /** Позиції послуг у записі (T-4520a): для композитного слота. */
  servicePositions?: ServicePosition[];
}

/** Скалярні nullable-поля й дефолти; винесено, щоб тримати складкість низькою. */
function basicOptionalFields(params: BookingCreateParams) {
  return {
    serviceId: params.serviceId ?? null,
    agreedPrice: params.agreedPrice ?? null,
    appliedDiscounts: params.appliedDiscounts ?? null,
    source: params.source ?? 'web',
  };
}

/** Скалярні nullable-поля й дефолти; винесено, щобтримати складкість низькою. */
function surgeOptionalFields(params: BookingCreateParams) {
  return {
    fulfillmentMode: params.fulfillmentMode ?? null,
    haircutReferenceId: params.haircutReferenceId ?? null,
    appointmentComment: params.appointmentComment ?? null,
    clientId: params.clientId ?? null,
    surgeBasisPoints: params.surgeBasisPoints ?? null,
    surgeRuleId: params.surgeRuleId ?? null,
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

/** Скалярні nullable-поля й дефолти; винесено, щобтримати складкість низько. */
function resolveDuration(params: BookingCreateParams): number {
  return (
    params.agreedDuration ?? Math.round((params.end.getTime() - params.start.getTime()) / 60000)
  );
}

/** Визначення депозиту. */
function resolveDeposit(params: BookingCreateParams): DepositTerms | null {
  const depositTerms = depositTermsFor(params.finalPrice, params.depositPolicy ?? DEFAULT_DEPOSIT_POLICY);
  return depositTerms ?? null;
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