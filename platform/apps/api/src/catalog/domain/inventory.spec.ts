import { applyMovement, InsufficientStockError, receiveByScan, type StockItem } from './inventory';
import {
  buildPurchaseOrderDrafts,
  forecastConsumption,
  needsReorder,
  reorderQuantity,
} from './inventory-forecast';

const now = new Date('2026-11-22T00:00:00Z');
const DAY = 86_400_000;

function item(overrides: Partial<StockItem> = {}): StockItem {
  return {
    sku: 'POMADE-001',
    name: 'Matte Pomade',
    unit: 'unit',
    onHand: 20,
    reorderPoint: 10,
    safetyStock: 5,
    unitCostMinor: 12_000,
    supplierId: 'supplier-1',
    leadTimeDays: 7,
    barcode: '4820000000011',
    ...overrides,
  };
}

describe('stock movements (T-5011)', () => {
  it('receives, sells and reconciles counted quantities', () => {
    const received = applyMovement(item(), { sku: 'POMADE-001', kind: 'received', quantity: 5, occurredAt: now });
    expect(received.onHand).toBe(25);

    const sold = applyMovement(received, { sku: 'POMADE-001', kind: 'sold', quantity: 2, occurredAt: now });
    expect(sold.onHand).toBe(23);

    const counted = applyMovement(sold, { sku: 'POMADE-001', kind: 'counted', quantity: 21, occurredAt: now });
    expect(counted.onHand).toBe(21);
  });

  it('rejects overselling and movements for another SKU', () => {
    expect(() =>
      applyMovement(item({ onHand: 1 }), { sku: 'POMADE-001', kind: 'sold', quantity: 2, occurredAt: now })
    ).toThrow(InsufficientStockError);
    expect(() =>
      applyMovement(item(), { sku: 'OTHER', kind: 'received', quantity: 1, occurredAt: now })
    ).toThrow(/cannot be applied/);
  });

  it('checks in stock only when the scanned barcode matches', () => {
    expect(receiveByScan(item(), '4820000000011', 4).onHand).toBe(24);
    expect(receiveByScan(item({ barcode: undefined }), 'POMADE-001', 1).onHand).toBe(21);
    expect(() => receiveByScan(item(), 'WRONG', 1)).toThrow(/does not belong/);
    expect(() => receiveByScan(item(), '4820000000011', 0)).toThrow(/positive/);
  });
});

describe('consumption forecast and purchase orders (T-5011)', () => {
  const movements = [
    { sku: 'POMADE-001', kind: 'sold' as const, quantity: 2, occurredAt: new Date(now.getTime() - 4 * DAY) },
    { sku: 'POMADE-001', kind: 'sold' as const, quantity: 3, occurredAt: new Date(now.getTime() - 2 * DAY) },
    { sku: 'POMADE-001', kind: 'sold' as const, quantity: 1, occurredAt: now },
    { sku: 'POMADE-001', kind: 'received' as const, quantity: 10, occurredAt: now },
  ];

  it('forecasts the daily rate, cover and depletion date', () => {
    const forecast = forecastConsumption(item(), movements);
    expect(forecast.dailyRate).toBeCloseTo(6 / 5);
    expect(forecast.daysOfCover).toBeCloseTo(20 / 1.2);
    expect(forecast.projectedDepletionAt?.getTime()).toBeGreaterThan(now.getTime());
  });

  it('returns an infinite cover when nothing was consumed', () => {
    const forecast = forecastConsumption(item({ onHand: 0 }), []);
    expect(forecast.dailyRate).toBe(0);
    expect(forecast.daysOfCover).toBe(Infinity);
    expect(forecast.projectedDepletionAt).toBeUndefined();
  });

  it('sizes reorders with lead-time demand and groups drafts by supplier', () => {
    const forecast = forecastConsumption(item(), movements);
    expect(needsReorder(item({ onHand: 10 }))).toBe(true);
    expect(needsReorder(item({ onHand: 11 }))).toBe(false);
    // 10 reorder point + 5 safety + ceil(1.2 * 7)=9 lead time - 8 on hand
    expect(reorderQuantity(item({ onHand: 8 }), forecast)).toBe(16);

    const drafts = buildPurchaseOrderDrafts(
      [
        item({ onHand: 8 }),
        item({ sku: 'OIL-002', name: 'Beard Oil', onHand: 1, supplierId: 'supplier-2', unitCostMinor: 8_000 }),
        item({ sku: 'WAX-003', name: 'Hair Wax', onHand: 50, unitCostMinor: 9_000 }),
      ],
      [forecast],
      now
    );

    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.supplierId).toBe('supplier-1');
    expect(drafts[0]?.totalCostMinor).toBe(16 * 12_000);
    expect(drafts[1]?.supplierId).toBe('supplier-2');
  });
});
