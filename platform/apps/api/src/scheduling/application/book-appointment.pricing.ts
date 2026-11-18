import { calculateDiscounts } from '../../discounts/domain/discount-calculator';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';
import type { BookAppointmentDeps } from './book-appointment.types';

/** Снепшот ціни візиту (T-090), що фіксується на Booking при створенні. */
export interface PriceSnapshot {
  agreedPrice?: number;
  appliedDiscounts?: AppliedDiscount[];
  finalPrice?: number;
  /** Снепшот surge (T-4811): множник і правило, за яким він застосований. */
  surgeBasisPoints?: number;
  surgeRuleId?: string;
}

/**
 * `AgreedPrice` — зі снепшоту послуги (ADR 0006), знижки застосовує
 * `DiscountCalculator` при записі (ADR 0007). Без знижок `FinalPrice` =
 * `AgreedPrice`. Снепшот незмінний: подальша зміна цін/правил не рухає записи.
 */
export async function priceSnapshot(
  deps: BookAppointmentDeps,
  start: Date,
  locationId: string
): Promise<PriceSnapshot> {
  const snapshot = deps.serviceSnapshot;
  if (!snapshot) return {};
  // Surge множить базову ціну ДО знижок: знижка рахується від уже surge-ціни.
  const surge = deps.surge
    ? await deps.surge.quote({ locationId, start, basePrice: snapshot.agreedPrice })
    : null;
  const breakdown = calculateDiscounts({
    agreedPrice: surge ? surge.price : snapshot.agreedPrice,
    ...deps.discounts,
  });
  return {
    agreedPrice: breakdown.agreedPrice,
    appliedDiscounts: breakdown.appliedDiscounts,
    finalPrice: breakdown.finalPrice,
    ...(surge && surge.multiplierBp !== 10_000
      ? {
          surgeBasisPoints: surge.multiplierBp,
          ...(surge.ruleId ? { surgeRuleId: surge.ruleId } : {}),
        }
      : {}),
  };
}
