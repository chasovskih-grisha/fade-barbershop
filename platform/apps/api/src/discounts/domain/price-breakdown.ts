// Розбивка ціни візиту (T-090a, DSC-006): базова ціна каталогу → підсумок.
// `AgreedPrice` береться з каталогу в момент запису (ADR 0006) і тут лише
// читається — домен не звертається до каталогу і не перераховує стару ціну.
// Гроші — цілі копійки: цілочисельна математика без float (DSC-004).

/** Застосована знижка: тип, джерело та сума у копійках (снепшот, ADR 0007). */
export interface AppliedDiscount {
  /** Тип: промокод, автоматичне правило, VIP-рівень (DSC-002). */
  type: 'promo_code' | 'rule' | 'vip';
  /** ID джерела (код/правило/картка клієнта) для аудиту і статистики. */
  sourceId: string;
  /** Сума знижки в копійках, ≥ 0. */
  amount: number;
}

/** Розбивка ціни для екрана підтвердження, чека й адмінки (DSC-006). */
export interface PriceBreakdown {
  agreedPrice: number;
  appliedDiscounts: AppliedDiscount[];
  totalDiscount: number;
  finalPrice: number;
}

/** Сума в копійках: скінченне невід'ємне ціле (захист від float і NaN). */
function toCents(amount: number): number {
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
}

/**
 * Розбивка із застосованими знижками. Кожна знижка обрізається так, щоб
 * `finalPrice` ≥ 0 (DSC-004): фіксована знижка, більша за ціну, дає 0.
 */
export function buildPriceBreakdown(
  agreedPrice: number,
  discounts: AppliedDiscount[]
): PriceBreakdown {
  const base = toCents(agreedPrice);
  const applied: AppliedDiscount[] = [];
  let remaining = base;
  for (const discount of discounts) {
    const amount = Math.min(toCents(discount.amount), remaining);
    if (amount === 0) continue;
    applied.push({ ...discount, amount });
    remaining -= amount;
  }
  return {
    agreedPrice: base,
    appliedDiscounts: applied,
    totalDiscount: base - remaining,
    finalPrice: remaining,
  };
}
