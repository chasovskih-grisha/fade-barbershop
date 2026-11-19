// DiscountCalculator (T-090b, DSC-001…004): знижки застосовуються при записі
// і фіксуються на візиті як `AppliedDiscounts` (ADR 0007). Стек обмежений:
// VIP + промокод комбінуються, автоматичні правила — лише найвигідніше з них
// і без VIP/промокода (DSC-003). Сумарна знижка ≤ кап. Гроші — копійки, без float.

import { buildPriceBreakdown, type AppliedDiscount, type PriceBreakdown } from './price-breakdown';

export type { AppliedDiscount, PriceBreakdown };

/** Джерело знижки: % від `AgreedPrice` або фіксована сума в копійках (DSC-002). */
export interface DiscountSource {
  type: AppliedDiscount['type'];
  sourceId: string;
  percent?: number;
  amount?: number;
}

export interface DiscountInput {
  agreedPrice: number;
  promoCode?: DiscountSource;
  /** Автоматичні правила (перший візит, непікові години, день тижня). */
  rules?: DiscountSource[];
  vip?: DiscountSource;
  /** Кап сумарної знижки у відсотках від `AgreedPrice`; дефолт 30 (DSC-ADM-06). */
  capPercent?: number;
}

const DEFAULT_CAP_PERCENT = 30;

/** Сума в копійках: скінченне невід'ємне ціле. */
function toCents(amount: number | undefined): number {
  return amount !== undefined && Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
}

/** Відсоток у межах [0, 100]; більше — обрізається (100% дозволено, DSC-013). */
function toPercent(percent: number | undefined): number {
  if (percent === undefined || !Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

/** Грошова сума джерела: фіксована сума переважає відсоток, якщо задана. */
function amountOf(source: DiscountSource, agreedPrice: number): number {
  if (source.amount !== undefined) return toCents(source.amount);
  return Math.round((agreedPrice * toPercent(source.percent)) / 100);
}

/** Найвигідніше автоматичне правило за сумою (DSC-003); решта не комбінуються. */
function bestRule(rules: DiscountSource[], agreedPrice: number): DiscountSource | null {
  let best: DiscountSource | null = null;
  let bestAmount = 0;
  for (const rule of rules) {
    const amount = amountOf(rule, agreedPrice);
    if (amount > bestAmount) {
      bestAmount = amount;
      best = rule;
    }
  }
  return best;
}

/**
 * Обчислити застосовані знижки та розбивку ціни. Порядок: VIP, промокод,
 * найвигідніше правило — після чого сума знижок обрізається до капу.
 */
export function calculateDiscounts(input: DiscountInput): PriceBreakdown {
  const agreedPrice = toCents(input.agreedPrice);
  const capPercent = input.capPercent ?? DEFAULT_CAP_PERCENT;
  const cap = Math.floor((agreedPrice * Math.max(0, capPercent)) / 100);

  const chosen: AppliedDiscount[] = [];
  if (input.vip) {
    chosen.push({
      type: 'vip',
      sourceId: input.vip.sourceId,
      amount: amountOf(input.vip, agreedPrice),
    });
  }
  if (input.promoCode) {
    chosen.push({
      type: 'promo_code',
      sourceId: input.promoCode.sourceId,
      amount: amountOf(input.promoCode, agreedPrice),
    });
  } else {
    const rule = bestRule(input.rules ?? [], agreedPrice);
    if (rule) {
      chosen.push({ type: 'rule', sourceId: rule.sourceId, amount: amountOf(rule, agreedPrice) });
    }
  }

  const rawTotal = chosen.reduce((sum, d) => sum + d.amount, 0);
  // Кап обмежує лише стек (VIP + промокод, DSC-003): поодинока знижка
  // застосовується як є і лише обрізається до ціни (DSC-004, DSC-013).
  const capped = chosen.length > 1 ? capStack(chosen, cap, rawTotal) : chosen;
  return buildPriceBreakdown(agreedPrice, capped);
}

/** Обрізати стек до капу: пропорційно, останній рядок добирає залишок. */
function capStack(discounts: AppliedDiscount[], cap: number, total: number): AppliedDiscount[] {
  if (total <= cap || total === 0) return discounts;
  let left = cap;
  return discounts.map((discount, index) => {
    const amount =
      index === discounts.length - 1 ? left : Math.floor((discount.amount * cap) / total);
    left -= amount;
    return { ...discount, amount };
  });
}
