// ApplyDiscountService — T-152: застосування знижок при записі.
//
// Один калькулятор (T-090) і три джерела: промокод, автоматичні правила
// (перший візит / непікові години) і VIP-рівень клієнта. Рішення DSC-003:
// комбінуються лише VIP + промокод; правила — одне найвигідніше і без них;
// сумарна знижка ≤ кап. 100% знижка дає FinalPrice = 0 і причину
// `full_discount_promo` — без Payment і чека (DSC-013).
import {
  calculateDiscounts,
  type DiscountSource,
} from '../domain/discount-calculator';
import type { AppliedDiscount, PriceBreakdown } from '../domain/price-breakdown';
import {
  evaluatePromoCode,
  isFullDiscount,
  normalizePromoCode,
  type PromoCode,
  type PromoCodeUsage,
  type PromoCodeEvaluation,
} from '../domain/promo-code';
import { applicableRuleSources, type DiscountRule } from '../domain/discount-rules';
import { vipDiscountSource, type ClientDiscountLevel } from '../domain/client-discount-level';

/** Порти, потрібні застосуванню знижок. */
export interface DiscountPorts {
  findPromoCode(code: string): Promise<PromoCode | null>;
  promoCodeUsage(codeId: string, clientId: string): Promise<PromoCodeUsage>;
  activeRules(): Promise<DiscountRule[]>;
  clientDiscountLevel(clientId: string): Promise<ClientDiscountLevel | null>;
  hasCompletedVisit(clientId: string): Promise<boolean>;
}

export interface ApplyDiscountInput {
  /** Базова ціна візиту з каталогу, у копійках (ADR 0006). */
  agreedPriceCents: number;
  clientId: string;
  serviceId?: string;
  /** Сирий код від клієнта; нечутливий до регістру (DSC-WEB-03). */
  promoCode?: string;
  /** Обраний слот — потрібен для правила «непікові години». */
  slotStart?: Date;
  timeZone?: string;
  /** Кап сумарної знижки у %, дефолт 30 (DSC-ADM-06). */
  capPercent?: number;
  now?: Date;
}

export type DiscountReason = 'full_discount_promo' | 'full_discount_rule' | 'full_discount_vip';

export interface PromoCodeVerdict {
  code: string;
  valid: boolean;
  message: string;
}

export interface ApplyDiscountResult {
  breakdown: PriceBreakdown;
  appliedDiscounts: AppliedDiscount[];
  /** false — візит безкоштовний: без Payment, чека й депозиту (DSC-013/PAY-003). */
  requiresPayment: boolean;
  reason?: DiscountReason;
  /** Присутній, лише якщо клієнт ввів код (DSC-WEB-02). */
  promo?: PromoCodeVerdict;
}

export class ApplyDiscountService {
  constructor(private readonly ports: DiscountPorts) {}

  /** Розрахунок знижок для запису; недійсний код запис не блокує. */
  async apply(input: ApplyDiscountInput): Promise<ApplyDiscountResult> {
    const now = input.now ?? new Date();

    let promoSource: DiscountSource | undefined;
    let promo: PromoCodeVerdict | undefined;
    if (input.promoCode) {
      const evaluation = await this.checkPromoCode(
        input.promoCode,
        input.clientId,
        input.serviceId,
        now
      );
      promo = { code: normalizePromoCode(input.promoCode), valid: evaluation.valid, message: evaluation.message };
      if (evaluation.valid && evaluation.source) promoSource = evaluation.source;
    }

    const rules = await this.ports.activeRules();
    const hasCompletedVisit = await this.ports.hasCompletedVisit(input.clientId);
    const ruleSources = applicableRuleSources(rules, {
      hasCompletedVisit,
      slotStart: input.slotStart ?? now,
      ...(input.timeZone ? { timeZone: input.timeZone } : {}),
    });

    const vip = vipDiscountSource(await this.ports.clientDiscountLevel(input.clientId));

    const breakdown = calculateDiscounts({
      agreedPrice: input.agreedPriceCents,
      ...(promoSource ? { promoCode: promoSource } : {}),
      ...(ruleSources.length > 0 ? { rules: ruleSources } : {}),
      ...(vip ? { vip } : {}),
      ...(input.capPercent !== undefined ? { capPercent: input.capPercent } : {}),
    });

    const result: ApplyDiscountResult = {
      breakdown,
      appliedDiscounts: breakdown.appliedDiscounts,
      requiresPayment: breakdown.finalPrice > 0,
    };

    if (promo) result.promo = promo;

    const reason = this.fullDiscountReason(breakdown, promoSource, ruleSources, vip, input.agreedPriceCents);
    if (reason && breakdown.finalPrice === 0) {
      result.reason = reason;
      result.requiresPayment = false;
    }

    return result;
  }

  /** Валідація коду для поля «Промокод» (DSC-WEB-01/02). */
  async validatePromoCode(
    rawCode: string,
    clientId: string,
    serviceId?: string
  ): Promise<PromoCodeVerdict> {
    const evaluation = await this.checkPromoCode(rawCode, clientId, serviceId, new Date());
    return { code: normalizePromoCode(rawCode), valid: evaluation.valid, message: evaluation.message };
  }

  /** VIP-рівень клієнта для профілю та розбивки (DSC-VIP-02). */
  async vipDiscount(
    clientId: string
  ): Promise<{ percent: number | null; amount: number | null; isVip: boolean }> {
    const source = vipDiscountSource(await this.ports.clientDiscountLevel(clientId));
    if (!source) return { percent: null, amount: null, isVip: false };
    return {
      percent: source.percent ?? null,
      amount: source.amount ?? null,
      isVip: true,
    };
  }

  private async checkPromoCode(
    rawCode: string,
    clientId: string,
    serviceId: string | undefined,
    now: Date
  ): Promise<PromoCodeEvaluation> {
    const code = await this.ports.findPromoCode(normalizePromoCode(rawCode));
    if (!code) return evaluatePromoCode({ code: null, now });

    const usage = await this.ports.promoCodeUsage(code.id, clientId);
    return evaluatePromoCode({
      code,
      usage,
      now,
      ...(serviceId ? { serviceId } : {}),
    });
  }

  private fullDiscountReason(
    breakdown: PriceBreakdown,
    promo: DiscountSource | undefined,
    rules: DiscountSource[],
    vip: DiscountSource | undefined,
    agreedPrice: number
  ): DiscountReason | undefined {
    if (breakdown.finalPrice !== 0 || agreedPrice <= 0) return undefined;
    if (promo && this.reachesPrice(promo, agreedPrice)) return 'full_discount_promo';
    if (vip && this.reachesPrice(vip, agreedPrice)) return 'full_discount_vip';
    const rule = rules.find((candidate) => this.reachesPrice(candidate, agreedPrice));
    return rule ? 'full_discount_rule' : undefined;
  }

  private reachesPrice(source: DiscountSource, agreedPrice: number): boolean {
    return isFullDiscount(
      source.amount !== undefined
        ? { kind: 'amount', amount: source.amount }
        : { kind: 'percent', percent: source.percent ?? 0 },
      agreedPrice
    );
  }
}
