/* eslint-disable max-lines -- cohesive module (236 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-152: промокод, автоматичні правила й VIP через один калькулятор.
// Порти — фейки в памʼяті: перевіряємо правила DSC, а не Prisma.
import { normalizePromoCode, uahToCents, type PromoCode } from '../domain/promo-code';
import type { DiscountRule } from '../domain/discount-rules';
import type { ClientDiscountLevel } from '../domain/client-discount-level';
import { ApplyDiscountService, type DiscountPorts } from './apply-discount.use-case';

const NOW = new Date('2026-11-19T09:00:00Z'); // чт, 11:00 у Києві
const KYIV = 'Europe/Kyiv';
const PRICE = 40_000; // 400 ₴ у копійках

function promo(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 'promo-1',
    code: 'INSTAGRAM10',
    value: { kind: 'percent', percent: 10 },
    active: true,
    ...overrides,
  };
}

const firstVisit: DiscountRule = {
  id: 'rule-first-visit',
  kind: 'first_visit',
  value: { kind: 'percent', percent: 10 },
  active: true,
};

const offPeak: DiscountRule = {
  id: 'rule-off-peak',
  kind: 'off_peak',
  value: { kind: 'percent', percent: 15 },
  active: true,
  offPeak: { weekdays: [1, 2, 3, 4], startMinute: 10 * 60, endMinute: 13 * 60 },
};

function harness(
  options: {
    codes?: PromoCode[];
    usage?: { total: number; byClient: number };
    rules?: DiscountRule[];
    level?: ClientDiscountLevel | null;
    hasCompletedVisit?: boolean;
  } = {}
) {
  const codes = options.codes ?? [promo()];
  const findPromoCode = jest.fn(
    async (code: string) => codes.find((candidate) => candidate.code === code) ?? null
  );
  const hasCompletedVisit = jest.fn(async () => options.hasCompletedVisit ?? false);

  const ports: DiscountPorts = {
    findPromoCode,
    promoCodeUsage: async () => options.usage ?? { total: 0, byClient: 0 },
    activeRules: async () => options.rules ?? [],
    clientDiscountLevel: async (clientId: string) =>
      options.level && options.level.clientId === clientId ? options.level : null,
    hasCompletedVisit,
  };

  return { service: new ApplyDiscountService(ports), findPromoCode, hasCompletedVisit };
}

describe('ApplyDiscountService (T-152)', () => {
  it('applies a percent promo code to the agreed price', async () => {
    const { service, findPromoCode } = harness();

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      promoCode: '  instagram10 ',
      now: NOW,
    });

    expect(findPromoCode).toHaveBeenCalledWith('INSTAGRAM10');
    expect(result.appliedDiscounts).toEqual([
      { type: 'promo_code', sourceId: 'INSTAGRAM10', amount: 4000 },
    ]);
    expect(result.breakdown.finalPrice).toBe(36_000);
    expect(result.requiresPayment).toBe(true);
    expect(result.promo).toEqual({ code: 'INSTAGRAM10', valid: true, message: 'Знижка 10%' });
    expect(result.reason).toBeUndefined();
  });

  it('tells the client the code expired and still prices the visit (DSC-WEB-02)', async () => {
    const { service } = harness({
      codes: [promo({ validUntil: new Date('2026-11-01T00:00:00Z') })],
    });

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      promoCode: 'INSTAGRAM10',
      now: NOW,
    });

    expect(result.promo).toEqual({
      code: 'INSTAGRAM10',
      valid: false,
      message: 'Термін дії закінчився',
    });
    expect(result.appliedDiscounts).toEqual([]);
    expect(result.breakdown.finalPrice).toBe(PRICE);
  });

  it('rejects a code whose usage limit is exhausted', async () => {
    const { service } = harness({
      codes: [promo({ usageLimit: 5 })],
      usage: { total: 5, byClient: 0 },
    });

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      promoCode: 'instagram10',
      now: NOW,
    });

    expect(result.promo?.valid).toBe(false);
    expect(result.promo?.message).toBe('Ліміт використань вичерпано');
    expect(result.breakdown.finalPrice).toBe(PRICE);
  });

  it('treats an unknown code as invalid without blocking the booking', async () => {
    const { service } = harness();

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      promoCode: 'NOPE',
      now: NOW,
    });

    expect(result.promo?.message).toBe('Код не дійсний');
    expect(result.appliedDiscounts).toEqual([]);
  });

  it('makes a 100% promo visit free with reason full_discount_promo (DSC-013)', async () => {
    const { service } = harness({
      codes: [promo({ code: 'FREE100', value: { kind: 'percent', percent: 100 } })],
    });

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      promoCode: 'free100',
      now: NOW,
    });

    expect(result.breakdown.finalPrice).toBe(0);
    expect(result.requiresPayment).toBe(false);
    expect(result.reason).toBe('full_discount_promo');
  });

  it('treats a fixed discount above the price as a full discount (DSC-004)', async () => {
    const { service } = harness({
      codes: [promo({ code: 'BIG', value: { kind: 'amount', amount: uahToCents(900) } })],
    });

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      promoCode: 'BIG',
      now: NOW,
    });

    expect(result.breakdown.totalDiscount).toBe(PRICE);
    expect(result.breakdown.finalPrice).toBe(0);
    expect(result.reason).toBe('full_discount_promo');
  });

  it('stacks VIP with a promo code and caps the stack at 30% (DSC-003)', async () => {
    const { service } = harness({
      codes: [promo({ value: { kind: 'percent', percent: 20 } })],
      level: { clientId: 'client-1', value: { kind: 'percent', percent: 20 } },
    });

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      promoCode: 'INSTAGRAM10',
      now: NOW,
    });

    expect(result.appliedDiscounts.map((discount) => discount.type)).toEqual(['vip', 'promo_code']);
    expect(result.breakdown.totalDiscount).toBe(12_000);
    expect(result.breakdown.finalPrice).toBe(28_000);
  });

  it('applies the first-visit rule only before a completed visit (DSC-RULE-01)', async () => {
    const fresh = harness({ rules: [firstVisit] });
    const returning = harness({ rules: [firstVisit], hasCompletedVisit: true });

    const first = await fresh.service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      slotStart: NOW,
      now: NOW,
    });
    const second = await returning.service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      slotStart: NOW,
      now: NOW,
    });

    expect(first.appliedDiscounts).toEqual([
      { type: 'rule', sourceId: 'rule-first-visit', amount: 4000 },
    ]);
    expect(second.appliedDiscounts).toEqual([]);
    expect(second.breakdown.finalPrice).toBe(PRICE);
  });

  it('applies the off-peak rule by the slot time in the location timezone (DSC-RULE-02)', async () => {
    const { service } = harness({ rules: [offPeak] });

    const inside = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      slotStart: new Date('2026-11-19T09:00:00Z'), // 11:00 Kyiv
      timeZone: KYIV,
      now: NOW,
    });
    const outside = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      slotStart: new Date('2026-11-19T13:30:00Z'), // 15:30 Kyiv
      timeZone: KYIV,
      now: NOW,
    });

    expect(inside.appliedDiscounts).toEqual([
      { type: 'rule', sourceId: 'rule-off-peak', amount: 6000 },
    ]);
    expect(outside.appliedDiscounts).toEqual([]);
  });

  it('ignores disabled rules on new bookings (DSC-RULE-03)', async () => {
    const { service } = harness({ rules: [{ ...firstVisit, active: false }] });

    const result = await service.apply({
      agreedPriceCents: PRICE,
      clientId: 'client-1',
      slotStart: NOW,
      now: NOW,
    });

    expect(result.appliedDiscounts).toEqual([]);
  });

  it('validates a promo code for the input field and reports the VIP level', async () => {
    const { service } = harness({
      codes: [promo({ code: 'VIP001', value: { kind: 'amount', amount: uahToCents(50) } })],
      level: { clientId: 'client-1', value: { kind: 'percent', percent: 15 } },
    });

    await expect(service.validatePromoCode(' vip001 ', 'client-1')).resolves.toEqual({
      code: 'VIP001',
      valid: true,
      message: 'Знижка 50 ₴',
    });
    await expect(service.vipDiscount('client-1')).resolves.toEqual({
      percent: 15,
      amount: null,
      isVip: true,
    });
    await expect(service.vipDiscount('client-2')).resolves.toEqual({
      percent: null,
      amount: null,
      isVip: false,
    });
  });

  it('normalises codes the way the surfaces expect (DSC-WEB-03)', () => {
    expect(normalizePromoCode('  insta gram 10 ')).toBe('INSTAGRAM10');
    expect(uahToCents(50)).toBe(5000);
  });
});
