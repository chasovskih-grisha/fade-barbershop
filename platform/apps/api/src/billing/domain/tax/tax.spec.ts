import { FxRateCache, MissingFxRateError } from './currency';
import { buildTaxInvoice } from './tax-invoice';
import { calculateLineTax, calculateTax, taxRateFor, type TaxJurisdiction } from './tax-jurisdiction';

const euVat: TaxJurisdiction = {
  id: 'eu-de',
  country: 'DE',
  pricesIncludeTax: true,
  rules: [{ id: 'vat-de', kind: 'vat', rate: 0.19 }],
};

const usState: TaxJurisdiction = {
  id: 'us-ny-nyc',
  country: 'US',
  region: 'NY',
  pricesIncludeTax: false,
  rules: [
    { id: 'ny-sales', kind: 'sales_tax', rate: 0.04 },
    { id: 'nyc-municipal', kind: 'municipal', rate: 0.045, appliesTo: ['retail'] },
  ],
};

describe('multi-currency (T-5004)', () => {
  it('converts through a cached rate and rejects stale or missing rates', () => {
    let now = 0;
    const cache = new FxRateCache(1000, () => now);
    cache.set({ from: 'USD', to: 'UAH', rate: 41.5, asOf: new Date(0) });

    expect(cache.convert({ amountMinor: 1000, currency: 'USD' }, 'UAH')).toEqual({
      amountMinor: 41_500,
      currency: 'UAH',
    });
    expect(cache.convert({ amountMinor: 500, currency: 'UAH' }, 'UAH').amountMinor).toBe(500);

    now = 1001;
    expect(cache.get('USD', 'UAH')).toBeUndefined();
    expect(() => cache.convert({ amountMinor: 100, currency: 'USD' }, 'UAH')).toThrow(
      MissingFxRateError
    );
  });
});

describe('tax jurisdictions (T-5004)', () => {
  it('extracts included EU VAT instead of adding it', () => {
    const line = calculateLineTax({ id: 'l1', category: 'haircut', amountMinor: 11_900 }, euVat);
    expect(line.taxableMinor).toBe(10_000);
    expect(line.taxMinor).toBe(1_900);
    expect(line.totalMinor).toBe(11_900);
    expect(line.breakdown[0]?.amountMinor).toBe(1_900);
  });

  it('adds US state plus category-scoped municipal tax', () => {
    expect(taxRateFor(usState, 'haircut')).toBeCloseTo(0.04);
    expect(taxRateFor(usState, 'retail')).toBeCloseTo(0.085);

    const total = calculateTax(
      [
        { id: 'l1', category: 'haircut', amountMinor: 5_000 },
        { id: 'l2', category: 'retail', amountMinor: 2_000 },
      ],
      usState
    );
    expect(total.taxTotalMinor).toBe(200 + 170);
    expect(total.totalMinor).toBe(7_370);
  });

  it('builds a tax invoice with jurisdiction and breakdown', () => {
    const invoice = buildTaxInvoice({
      invoiceNumber: 'INV-2026-0001',
      issuedAt: new Date('2026-11-22T10:00:00Z'),
      currency: 'USD',
      jurisdiction: usState,
      customerName: 'Ada Lovelace',
      lines: [{ id: 'l1', category: 'haircut', amountMinor: 5_000 }],
    });
    expect(invoice.jurisdictionId).toBe('us-ny-nyc');
    expect(invoice.taxTotalMinor).toBe(200);
    expect(invoice.lines[0]?.breakdown).toHaveLength(1);
    expect(invoice.totalMinor).toBe(5_200);
  });
});
