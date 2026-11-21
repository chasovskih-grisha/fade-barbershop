import { calculateDiscounts } from '../../discounts/domain/discount-calculator';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';
import type { BookAppointmentDeps } from './book-appointment.types';
import { DEFAULT_SLOT_CONGESTION_CONFIG } from '../domain/slot-congestion-optimizer';

/** Снепшот ціни візиту (T-090), що фіксується на Booking при створенні. */
export interface PriceSnapshot {
  agreedPrice?: number;
  appliedDiscounts?: AppliedDiscount[];
  finalPrice?: number;
  /** Снепшот surge (T-4811): множник і правило, за яким він застосований. */
  surgeBasisPoints?: number;
  surgeRuleId?: string;
  /** Конгежованість слота (T-5011): множник і ознака surge. */
  congestionMultiplier?: number;
  surgeApplied?: boolean;
}

interface SurgeQuote {
  price: number;
  multiplierBp: number;
  ruleId: string | null;
}

interface CongestionQuote {
  multiplier: number;
  surgeApplied: boolean;
}

/**
 * `AgreedPrice` — зі снепшоту послуги (ADR 0006), знижки застосовує
 * `DiscountCalculator` при записі (ADR 0007). Без знижок `FinalPrice` =
 * `AgreedPrice`. Снепшот незмінний: подальша зміна цін/правил не рухає записи.
 */
export async function priceSnapshot(
  deps: BookAppointmentDeps,
  start: Date,
  ...[locationId, slotHour]: [string, number?]
): Promise<PriceSnapshot> {
  const snapshot = deps.serviceSnapshot;
  if (!snapshot) return {};

  const congestion = await quoteCongestion(deps, slotHour);
  const surge = await quoteSurge(deps, { locationId, start, basePrice: snapshot.agreedPrice });
  const breakdown = calculateDiscounts({
    agreedPrice: priceForDiscounts(snapshot.agreedPrice, surge, congestion?.multiplier ?? 1),
    ...deps.discounts,
  });

  return {
    agreedPrice: breakdown.agreedPrice,
    appliedDiscounts: breakdown.appliedDiscounts,
    finalPrice: breakdown.finalPrice,
    ...surgeSnapshotFields(surge),
    ...congestionSnapshotFields(congestion),
  };
}

async function quoteSurge(
  deps: BookAppointmentDeps,
  input: { locationId: string; start: Date; basePrice: number }
): Promise<SurgeQuote | null> {
  return deps.surge ? deps.surge.quote(input) : null;
}

async function quoteCongestion(
  deps: BookAppointmentDeps,
  slotHour?: number
): Promise<CongestionQuote | null> {
  if (slotHour === undefined || !deps.slotCongestionOptimizer) return null;

  const results = await deps.slotCongestionOptimizer.optimizeSlotCongestion(
    [{ slotHour, isWeekend: false, bookedCount: 0, totalCapacity: 1 }],
    DEFAULT_SLOT_CONGESTION_CONFIG
  );
  const result = results[0];
  return result
    ? { multiplier: result.pricingMultiplier, surgeApplied: result.surgeApplied }
    : null;
}

/** Surge вже повертає кінцеву ціну; конгежованість множить її додатково. */
function priceForDiscounts(
  basePrice: number,
  surge: SurgeQuote | null,
  congestionMultiplier: number
): number {
  return Math.round((surge ? surge.price : basePrice) * congestionMultiplier * 100) / 100;
}

function surgeSnapshotFields(surge: SurgeQuote | null) {
  if (!surge || surge.multiplierBp === 10_000) return {};
  return {
    surgeBasisPoints: surge.multiplierBp,
    ...(surge.ruleId ? { surgeRuleId: surge.ruleId } : {}),
  };
}

function congestionSnapshotFields(congestion: CongestionQuote | null) {
  if (!congestion) return {};
  return {
    congestionMultiplier: congestion.multiplier,
    surgeApplied: congestion.surgeApplied,
  };
}
