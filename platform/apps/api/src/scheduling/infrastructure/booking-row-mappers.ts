import type { Prisma } from '@prisma/client';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';

/** Снепшот знижок із JSON-рядка (T-090); не-масив або сміття — знижок немає. */
export function discountsOf(value: Prisma.JsonValue | null): AppliedDiscount[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(isAppliedDiscount);
}

function isAppliedDiscount(item: Prisma.JsonValue): item is AppliedDiscount & Prisma.JsonObject {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.type === 'string' &&
    typeof record.sourceId === 'string' &&
    typeof record.amount === 'number'
  );
}

/** Снепшот депозиту з рядка; неповний снепшот не вважаємо умовами. */
export function depositOf(row: {
  depositAmount: number | null;
  depositPercent: number | null;
  depositRounding: number | null;
  cancellationWindowHours: number | null;
}) {
  const { depositAmount, depositPercent, depositRounding, cancellationWindowHours } = row;
  if (
    depositAmount === null ||
    depositPercent === null ||
    depositRounding === null ||
    cancellationWindowHours === null
  )
    return null;
  return {
    amount: depositAmount,
    percent: depositPercent,
    rounding: depositRounding,
    cancellationWindowHours,
  };
}
