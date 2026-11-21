/* eslint-disable complexity -- 1 function with inherent domain branching (worst: evaluatePromoCode, complexity 21 vs 10); refactor tracked in T-2500f */
// PromoCode (T-152, DSC-001…003, DSC-WEB-02/03): код вводить клієнт.
// Нечутливий до регістру й пробілів, має термін дії, загальний ліміт,
// ліміт на клієнта і (опційно) список послуг. Недійсний код не блокує запис —
// просто не дає знижки; текст помилки фронт бере звідси (українською).
import type { DiscountSource } from './discount-calculator';

/** Значення знижки: % від AgreedPrice або фіксована сума в копійках (DSC-002). */
export type DiscountValue =
  { kind: 'percent'; percent: number } | { kind: 'amount'; amount: number };

export interface PromoCode {
  id: string;
  /** Нормалізований код (верхній регістр, без пробілів). */
  code: string;
  value: DiscountValue;
  active: boolean;
  validFrom?: Date;
  validUntil?: Date;
  /** Загальний ліміт використань; не задано — без ліміту. */
  usageLimit?: number;
  /** Ліміт на одного клієнта; дефолт — 1. */
  perClientLimit?: number;
  /** Послуги, на які діє код; порожньо — на всі. */
  serviceIds?: string[];
}

export interface PromoCodeUsage {
  total: number;
  byClient: number;
}

export type PromoCodeRejection =
  | 'invalid'
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'exhausted'
  | 'client_limit'
  | 'service_mismatch';

export interface PromoCodeEvaluation {
  valid: boolean;
  reason?: PromoCodeRejection;
  source?: DiscountSource;
  /** Готовий текст для клієнта (DSC-WEB-02). */
  message: string;
}

/** DSC-WEB-03: `instagram10` = `INSTAGRAM10`, пробіли ігноруються. */
export function normalizePromoCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/** Ліміт використань коду на клієнта за замовчуванням (WNB-003: 1). */
export const DEFAULT_PER_CLIENT_LIMIT = 1;

/** Копійки з гривень для фіксованих знижок (DSC-002). */
export function uahToCents(amountUah: number): number {
  if (!Number.isFinite(amountUah)) return 0;
  return Math.max(0, Math.round(amountUah * 100));
}

/** Джерело знижки для калькулятора: фіксована сума або відсоток. */
export function discountSourceFor(
  sourceId: string,
  type: DiscountSource['type'],
  value: DiscountValue
): DiscountSource {
  if (value.kind === 'percent') {
    return { type, sourceId, percent: Math.min(100, Math.max(0, value.percent)) };
  }
  return { type, sourceId, amount: Math.max(0, Math.round(value.amount)) };
}

/** Чи дає знижка нульову підсумкову ціну (DSC-013). */
export function isFullDiscount(value: DiscountValue, agreedPrice: number): boolean {
  if (value.kind === 'percent') return value.percent >= 100;
  return value.amount >= agreedPrice;
}

export function promoRejectionMessage(reason: PromoCodeRejection): string {
  switch (reason) {
    case 'expired':
      return 'Термін дії закінчився';
    case 'exhausted':
    case 'client_limit':
      return 'Ліміт використань вичерпано';
    default:
      return 'Код не дійсний';
  }
}

function rejection(reason: PromoCodeRejection): PromoCodeEvaluation {
  return { valid: false, reason, message: promoRejectionMessage(reason) };
}

/**
 * Перевірка коду перед застосуванням: активність, термін, ліміти, послуга.
 * `usage` — скільки разів код уже використано (усього і цим клієнтом).
 */
export function evaluatePromoCode(input: {
  code: PromoCode | null;
  usage?: PromoCodeUsage;
  serviceId?: string;
  now?: Date;
}): PromoCodeEvaluation {
  const { code } = input;
  if (!code) return rejection('invalid');
  if (!code.active) return rejection('inactive');

  const now = input.now ?? new Date();
  if (code.validFrom && now.getTime() < code.validFrom.getTime()) return rejection('not_started');
  if (code.validUntil && now.getTime() > code.validUntil.getTime()) return rejection('expired');

  const usage = input.usage ?? { total: 0, byClient: 0 };
  if (code.usageLimit !== undefined && usage.total >= code.usageLimit)
    return rejection('exhausted');

  const perClientLimit = code.perClientLimit ?? DEFAULT_PER_CLIENT_LIMIT;
  if (perClientLimit > 0 && usage.byClient >= perClientLimit) return rejection('client_limit');

  if (code.serviceIds && code.serviceIds.length > 0) {
    if (!input.serviceId || !code.serviceIds.includes(input.serviceId)) {
      return rejection('service_mismatch');
    }
  }

  const source = discountSourceFor(code.code, 'promo_code', code.value);
  const message =
    code.value.kind === 'percent'
      ? `Знижка ${source.percent ?? 0}%`
      : `Знижка ${Math.round((source.amount ?? 0) / 100)} ₴`;

  return { valid: true, source, message };
}
