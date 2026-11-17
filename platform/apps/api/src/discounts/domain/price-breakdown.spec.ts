import { buildPriceBreakdown, type AppliedDiscount } from './price-breakdown';

const promo = (amount: number): AppliedDiscount => ({
  type: 'promo_code',
  sourceId: 'IG10',
  amount,
});

describe('buildPriceBreakdown (T-090a, DSC-006)', () => {
  it('returns the agreed price as final price when there are no discounts', () => {
    const breakdown = buildPriceBreakdown(40000, []);
    expect(breakdown).toEqual({
      agreedPrice: 40000,
      appliedDiscounts: [],
      totalDiscount: 0,
      finalPrice: 40000,
    });
  });

  it('subtracts each discount and keeps the per-discount rows', () => {
    const breakdown = buildPriceBreakdown(40000, [promo(4000)]);
    expect(breakdown.finalPrice).toBe(36000);
    expect(breakdown.totalDiscount).toBe(4000);
    expect(breakdown.appliedDiscounts).toEqual([promo(4000)]);
  });

  it('never returns a negative final price — fixed discount above price is trimmed (DSC-004)', () => {
    const breakdown = buildPriceBreakdown(5000, [promo(9000)]);
    expect(breakdown.finalPrice).toBe(0);
    expect(breakdown.totalDiscount).toBe(5000);
    expect(breakdown.appliedDiscounts.map((d) => d.amount)).toEqual([5000]);
  });

  it('drops zero-amount discounts instead of listing empty rows', () => {
    const breakdown = buildPriceBreakdown(40000, [promo(0), promo(2000)]);
    expect(breakdown.appliedDiscounts.map((d) => d.amount)).toEqual([2000]);
  });

  it('ignores non-finite amounts and never leaks float arithmetic', () => {
    const breakdown = buildPriceBreakdown(10000, [promo(Number.NaN), promo(0.4)]);
    expect(breakdown.finalPrice).toBe(10000);
    expect(Number.isInteger(breakdown.finalPrice)).toBe(true);
  });
});
