/* eslint-disable max-lines -- cohesive module (119 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Імпорти
import { uuidv7 } from '@fade/domain-shared';
import { depositTermsFor, type DepositPolicy, type DepositTerms } from './deposit-terms';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';

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
  /** Обраний варіант тривалості (T-4419); null — базова тривалість. */
  durationVariant?: string | null;
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
  /** Позиції послуг у записі (T-4520a): для композитного слота. */
  servicePositions?: ServicePosition[] | null;
  /** Снепшот surge (T-4811): множник у базисних пунктах id правила. */
  surgeBasisPoints?: number | null;
  surgeRuleId?: string | null;
  /** Життєвий статус візиту (T-095): pending → confirmed → completed/cancelled. */
  status?: string | null;
  /** Чи візит вимагає оплати (T-092): false — повна знижка або безкоштовний візит. */
  requiresPayment?: boolean | null;
  /** Причина нульової доплати: full_discount_promo тощо (T-092). */
  discountReason?: string | null;
  /** Спосіб оплати візиту (PAY-ADM-04). */
  paymentMethod?: string | null;
  /** Статус депозиту візиту (PAY-ADM-09). */
  depositStatus?: string | null;
  /** Версія політики депозиту, яку клієнт підтвердив (PAY-4444). */
  depositPolicyVersionAccepted?: number | null;
  /** No-show ескалація (T-095): статус, момент і пов'язаний рефанд. */
  noShowStatus?: string | null;
  noShowEscalatedAt?: Date | null;
  noShowRefundId?: string | null;
  refundStatus?: string | null;
  refundInitiatedAt?: Date | null;
  refundReason?: string | null;
  refundReasonCode?: string | null;
  refundMetadata?: string | null;
  capturedRefundAmount?: number | null;
  refundId?: string | null;
}

/** Booking – booking-create-params.bookingData параметри. */
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
  /** Підпис обраного варіанта тривалості (T-4419) — снепшот на записі. */
  durationVariant?: string;
  fulfillmentMode?: 'sequential' | 'parallel';
  haircutReferenceId?: string;
  appointmentComment?: string;
  clientId?: string;
  /** Снепшот surge (T-4811): множник у базисних пунктів id правила. */
  surgeBasisPoints?: number | null;
  surgeRuleId?: string | null;
  /** Позиції послуг у записі (T-4520a): для композитного слота. */
  servicePositions?: ServicePosition[];
  /** Політика депозиту (PAY-ADM-09): снапшотиться на запис. */
  depositPolicy?: DepositPolicy;
  /** Причина повної знижки (DSC-013): потрібна для звітності й флоу оплати. */
  discountReason?: string;
  /** false — візит безкоштовний: без платежу й депозиту (PAY-003). */
  requiresPayment?: boolean;
  /** Канал запису (T-046): у BookAppointment визначає аналітику візиту. */
  source?: string;
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
    ...(params.discountReason === undefined ? {} : { discountReason: params.discountReason }),
    ...(params.requiresPayment === undefined ? {} : { requiresPayment: params.requiresPayment }),
    finalPrice: resolveFinalPrice(params),
    ...(params.servicePositions === undefined ? {} : { servicePositions: params.servicePositions }),
    ...(params.durationVariant === undefined ? {} : { durationVariant: params.durationVariant }),
  };
}

/** Скалярні nullable-поля й дефолти; винесено, щоб тримати складкість низькою. */
function resolveDuration(params: BookingCreateParams): number {
  return (
    params.agreedDuration ?? Math.round((params.end.getTime() - params.start.getTime()) / 60000)
  );
}

/** Визначення депозиту: від підсумкової ціни й політики візиту. */
function resolveDeposit(params: BookingCreateParams): DepositTerms | null {
  const price = resolveFinalPrice(params) ?? params.agreedPrice;
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
