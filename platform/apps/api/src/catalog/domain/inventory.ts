/** Per-location stock tracking and barcode check-in (T-5011). */

export type StockUnit = 'unit' | 'ml' | 'g';

export type MovementKind = 'received' | 'sold' | 'consumed' | 'counted';

export interface StockItem {
  readonly sku: string;
  readonly name: string;
  readonly unit: StockUnit;
  readonly onHand: number;
  readonly reorderPoint: number;
  readonly safetyStock: number;
  readonly unitCostMinor: number;
  readonly supplierId: string;
  readonly leadTimeDays: number;
  /** Retail barcode; defaults to the SKU when absent. */
  readonly barcode?: string;
}

export interface StockMovement {
  readonly sku: string;
  readonly kind: MovementKind;
  readonly quantity: number;
  readonly occurredAt: Date;
  readonly source?: string;
}

export class InsufficientStockError extends Error {
  constructor(
    readonly sku: string,
    readonly requested: number,
    readonly available: number
  ) {
    super(`Insufficient stock for ${sku}: requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}

function deltaFor(item: StockItem, movement: StockMovement): number {
  if (movement.kind === 'received') return movement.quantity;
  if (movement.kind === 'counted') return movement.quantity - item.onHand;
  return -movement.quantity;
}

/** Applies a movement; sales/consumption below zero are rejected, never clamped. */
export function applyMovement(item: StockItem, movement: StockMovement): StockItem {
  if (movement.sku !== item.sku) {
    throw new Error(`Movement for ${movement.sku} cannot be applied to ${item.sku}`);
  }
  const onHand = item.onHand + deltaFor(item, movement);
  if (onHand < 0) {
    throw new InsufficientStockError(item.sku, movement.quantity, item.onHand);
  }
  return { ...item, onHand };
}

/** Barcode check-in: the scanned code must match the SKU or the item barcode. */
export function receiveByScan(item: StockItem, scannedCode: string, quantity: number): StockItem {
  const matches = scannedCode === item.sku || scannedCode === (item.barcode ?? item.sku);
  if (!matches) throw new Error(`Barcode ${scannedCode} does not belong to ${item.sku}`);
  if (quantity <= 0) throw new Error('Received quantity must be positive');
  return applyMovement(item, {
    sku: item.sku,
    kind: 'received',
    quantity,
    occurredAt: new Date(),
    source: 'barcode',
  });
}
