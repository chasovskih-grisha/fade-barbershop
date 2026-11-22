/** Consumption forecasting and supplier purchase-order drafts (T-5011). */

import type { StockItem, StockMovement } from './inventory';

const DAY_MS = 86_400_000;

export interface ConsumptionForecast {
  readonly sku: string;
  /** Units consumed per day over the observed span (0 when no consumption). */
  readonly dailyRate: number;
  readonly daysOfCover: number;
  readonly projectedDepletionAt: Date | undefined;
}

export interface PurchaseOrderLine {
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitCostMinor: number;
  readonly totalCostMinor: number;
}

export interface PurchaseOrderDraft {
  readonly supplierId: string;
  readonly createdAt: Date;
  readonly lines: readonly PurchaseOrderLine[];
  readonly totalCostMinor: number;
}

function consumptionMovements(
  sku: string,
  movements: readonly StockMovement[]
): readonly StockMovement[] {
  return movements.filter(
    (movement) =>
      movement.sku === sku &&
      (movement.kind === 'sold' || movement.kind === 'consumed') &&
      movement.quantity > 0
  );
}

/** Daily consumption rate and depletion date from the observed movement span. */
export function forecastConsumption(
  item: StockItem,
  movements: readonly StockMovement[]
): ConsumptionForecast {
  const consumed = consumptionMovements(item.sku, movements);
  if (consumed.length === 0) {
    return { sku: item.sku, dailyRate: 0, daysOfCover: Infinity, projectedDepletionAt: undefined };
  }
  const times = consumed.map((movement) => movement.occurredAt.getTime());
  const first = Math.min(...times);
  const last = Math.max(...times);
  const spanDays = Math.max(1, (last - first) / DAY_MS + 1);
  const total = consumed.reduce((sum, movement) => sum + movement.quantity, 0);
  const dailyRate = total / spanDays;
  const daysOfCover = dailyRate > 0 ? item.onHand / dailyRate : Infinity;
  return {
    sku: item.sku,
    dailyRate,
    daysOfCover,
    projectedDepletionAt: Number.isFinite(daysOfCover)
      ? new Date(last + daysOfCover * DAY_MS)
      : undefined,
  };
}

export function needsReorder(item: StockItem): boolean {
  return item.onHand <= item.reorderPoint;
}

/** Reorder up to reorder point + safety stock + lead-time demand. */
export function reorderQuantity(item: StockItem, forecast: ConsumptionForecast): number {
  const leadTimeDemand = Math.ceil(forecast.dailyRate * item.leadTimeDays);
  const target = item.reorderPoint + item.safetyStock + leadTimeDemand;
  return Math.max(0, target - item.onHand);
}

/**
 * Builds one draft per supplier for every item at or below its reorder point.
 * Items without a forecast map entry are treated as zero-consumption.
 */
export function buildPurchaseOrderDrafts(
  items: readonly StockItem[],
  forecasts: readonly ConsumptionForecast[],
  createdAt: Date
): PurchaseOrderDraft[] {
  const forecastBySku = new Map(forecasts.map((forecast) => [forecast.sku, forecast]));
  const bySupplier = new Map<string, PurchaseOrderLine[]>();
  for (const item of items) {
    if (!needsReorder(item)) continue;
    const forecast = forecastBySku.get(item.sku) ?? {
      sku: item.sku,
      dailyRate: 0,
      daysOfCover: Infinity,
      projectedDepletionAt: undefined,
    };
    const quantity = reorderQuantity(item, forecast);
    if (quantity === 0) continue;
    const line: PurchaseOrderLine = {
      sku: item.sku,
      name: item.name,
      quantity,
      unitCostMinor: item.unitCostMinor,
      totalCostMinor: quantity * item.unitCostMinor,
    };
    bySupplier.set(item.supplierId, [...(bySupplier.get(item.supplierId) ?? []), line]);
  }
  return [...bySupplier.entries()].map(([supplierId, lines]) => ({
    supplierId,
    createdAt,
    lines,
    totalCostMinor: lines.reduce((sum, line) => sum + line.totalCostMinor, 0),
  }));
}
