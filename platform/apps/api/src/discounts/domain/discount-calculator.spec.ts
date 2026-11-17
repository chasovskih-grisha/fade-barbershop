import { calculateDiscounts } from './discount-calculator';

const vip = { type: 'vip' as const, sourceId: 'card-1', percent: 10 };
const promo = { type: 'promo_code' as const, sourceId: 'IG10', percent: 10 };
const firstVisit = { type: 'rule' as const, sourceId: 'first-visit', percent: 15 };
const offPeak = { type: 'rule' as const, sourceId: 'off-peak', percent: 5 };

describe('calculateDiscounts (T-090b, DSC-001…004)', () => {
  it('returns a plain breakdown without discounts', () => {
    const breakdown = calculateDiscounts({ agreedPrice: 40000 });
    expect(breakdown.finalPrice).toBe(40000);
    expect(breakdown.appliedDiscounts).toEqual([]);
  });

  it('applies a percent promo code to the agreed price', () => {
    const breakdown = calculateDiscounts({ agreedPrice: 40000, promoCode: promo });
    expect(breakdown.totalDiscount).toBe(4000);
    expect(breakdown.finalPrice).toBe(36000);
  });

  it('stacks VIP + promo code and lists each discount separately (DSC-003/006)', () => {
    const breakdown = calculateDiscounts({ agreedPrice: 40000, vip, promoCode: promo });
    expect(breakdown.appliedDiscounts.map((d) => d.type)).toEqual(['vip', 'promo_code']);
    expect(breakdown.totalDiscount).toBe(8000);
    expect(breakdown.finalPrice).toBe(32000);
  });

  it('caps the summed discount at 30% by default (DSC-003)', () => {
    const breakdown = calculateDiscounts({
      agreedPrice: 40000,
      vip,
      promoCode: { ...promo, percent: 30 },
    });
    expect(breakdown.totalDiscount).toBe(12000);
    expect(breakdown.finalPrice).toBe(28000);
  });

  it('honours a custom cap percent (DSC-ADM-06)', () => {
    const breakdown = calculateDiscounts({
      agreedPrice: 40000,
      vip,
      promoCode: promo,
      capPercent: 10,
    });
    expect(breakdown.totalDiscount).toBe(4000);
    expect(breakdown.finalPrice).toBe(36000);
  });

  it('picks only the single best automatic rule and never combines it with VIP/promo (DSC-003)', () => {
    const breakdown = calculateDiscounts({ agreedPrice: 40000, rules: [firstVisit, offPeak] });
    expect(breakdown.appliedDiscounts).toEqual([
      { type: 'rule', sourceId: 'first-visit', amount: 6000 },
    ]);
  });

  it('ignores automatic rules when a promo code is present', () => {
    const breakdown = calculateDiscounts({
      agreedPrice: 40000,
      promoCode: promo,
      rules: [firstVisit],
    });
    expect(breakdown.appliedDiscounts.map((d) => d.sourceId)).toEqual(['IG10']);
  });

  it('allows a 100% promo and yields a zero final price (DSC-013)', () => {
    const breakdown = calculateDiscounts({
      agreedPrice: 40000,
      promoCode: { ...promo, percent: 100 },
    });
    expect(breakdown.finalPrice).toBe(0);
    expect(breakdown.totalDiscount).toBe(40000);
  });

  it('trims a fixed discount larger than the price to zero (DSC-004)', () => {
    const breakdown = calculateDiscounts({
      agreedPrice: 5000,
      promoCode: { type: 'promo_code', sourceId: 'BIG', amount: 9000 },
    });
    expect(breakdown.finalPrice).toBe(0);
    expect(breakdown.totalDiscount).toBe(5000);
  });

  it('keeps all money as integer cents', () => {
    const breakdown = calculateDiscounts({
      agreedPrice: 33333,
      vip: { ...vip, percent: 7 },
      promoCode: { ...promo, percent: 11 },
    });
    expect(Number.isInteger(breakdown.finalPrice)).toBe(true);
    expect(breakdown.appliedDiscounts.every((d) => Number.isInteger(d.amount))).toBe(true);
  });
});
