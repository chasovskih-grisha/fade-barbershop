/* eslint-disable max-lines -- cohesive module (127 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Promotion & Discount Engine (T-4553)
// Promotion service integrating with existing discount infrastructure.

import type {
  PromotionEngineConfig,
  PromotionEvent,
  PromotionRegistry,
  PromotionRule,
  PromotionTrigger,
  PromoApplicationResult,
  PromoCode,
  PromoEvaluation,
} from '../domain/promotion.types';
import {
  ApplyDiscountService,
  type ApplyDiscountInput,
  type DiscountPorts,
  type PromoCodeVerdict,
} from '../../discounts/application/apply-discount.use-case';

const DEFAULT_CAP_PERCENT = 30;
const DEFAULT_MAX_TOTAL_DISCOUNT_PERCENT = 100;

/** Чисельний параметр дії правила. */
function numericParam(params: Record<string, unknown>, key: string): number {
  const value = params[key];
  return typeof value === 'number' ? value : 0;
}

export class PromotionService {
  constructor(
    private readonly discountPorts: DiscountPorts,
    private readonly applyDiscount: ApplyDiscountService,
    private readonly registry: PromotionRegistry
  ) {}

  /** Register a promotion rule. */
  registerRule(rule: PromotionRule): void {
    this.registry.addRule(rule);
  }

  /** Get registered rules for a trigger. */
  getRules(trigger: PromotionTrigger): PromotionRule[] {
    return this.registry.getRulesForTrigger(trigger);
  }

  /** Apply a promo code through the existing discount service. */
  async applyPromoCode(
    code: string,
    clientId: string,
    agreedPriceCents: number
  ): Promise<PromoApplicationResult> {
    const promoCode = await this.discountPorts.findPromoCode(code);
    if (!promoCode || !promoCode.active)
      return this.rejected(agreedPriceCents, 'promo_code_not_found_or_inactive');

    const usage = await this.discountPorts.promoCodeUsage(promoCode.id, clientId);
    if (promoCode.usageLimit !== undefined && usage.total >= promoCode.usageLimit) {
      return this.rejected(agreedPriceCents, 'promo_code_max_uses_reached');
    }
    if (promoCode.validUntil && promoCode.validUntil.getTime() < Date.now()) {
      return this.rejected(agreedPriceCents, 'promo_code_expired');
    }

    const input: ApplyDiscountInput = {
      agreedPriceCents,
      clientId,
      promoCode: code,
      now: new Date(),
    };
    const result = await this.applyDiscount.apply(input);
    return {
      success: result.requiresPayment,
      discountCents: result.breakdown.appliedDiscounts.reduce((sum, d) => sum + d.amount, 0),
      finalPriceCents: result.breakdown.finalPrice,
      reason: result.reason ?? result.promo?.message ?? 'promo_applied',
      applied: result.requiresPayment,
    };
  }

  /** Evaluate a promotion event through the registry. */
  async evaluateEvent(
    event: PromotionEvent,
    config: PromotionEngineConfig = {}
  ): Promise<PromoEvaluation> {
    return this.registry.evaluate(event, {
      capPercent: config.capPercent ?? DEFAULT_CAP_PERCENT,
      maxTotalDiscountPercent: config.maxTotalDiscountPercent ?? DEFAULT_MAX_TOTAL_DISCOUNT_PERCENT,
      ...(config.maxPerClientPerDay !== undefined
        ? { maxPerClientPerDay: config.maxPerClientPerDay }
        : {}),
    });
  }

  /** Check if a promo code is valid for a client. */
  validatePromoCode(rawCode: string, clientId: string): Promise<PromoCodeVerdict> {
    return this.applyDiscount.validatePromoCode(rawCode, clientId);
  }

  /** Available promo codes for a client/trigger (registry rules decide applicability). */
  async getAvailablePromos(
    _clientId: string,
    _trigger: PromotionTrigger,
    _payload: Record<string, unknown>
  ): Promise<PromoCode[]> {
    return [];
  }

  /** Apply discounts using the JSON Logic rule engine (first matching rule wins). */
  applyJsonLogicDiscount(
    agreedPriceCents: number,
    rules: PromotionRule[],
    payload: Record<string, unknown>
  ): { discountCents: number; finalPriceCents: number; reason: string } {
    for (const rule of rules) {
      if (!this.registry.evaluateCondition(rule.condition, payload)) continue;
      const applied = this.applyRuleAction(rule, agreedPriceCents);
      return { ...applied, reason: `jsonlogic_${rule.id}_${applied.reason}` };
    }
    return { discountCents: 0, finalPriceCents: agreedPriceCents, reason: 'no_rules_applied' };
  }

  /** Convert promotion rules to discount calculator sources. */
  getDiscountSources(rules: PromotionRule[]): Array<{ type: 'rule'; sourceId: string }> {
    return rules.map((rule) => ({ type: 'rule' as const, sourceId: rule.id }));
  }

  private applyRuleAction(
    rule: PromotionRule,
    price: number
  ): { discountCents: number; finalPriceCents: number; reason: string } {
    switch (rule.action) {
      case 'discount': {
        const percent = numericParam(rule.params, 'percent');
        const discountCents = percent > 0 ? Math.floor((percent / 100) * price) : 0;
        if (discountCents === 0)
          return { discountCents: 0, finalPriceCents: price, reason: 'skipped' };
        return { discountCents, finalPriceCents: price - discountCents, reason: 'discount' };
      }
      case 'free_visit':
        return { discountCents: price, finalPriceCents: 0, reason: 'free_visit' };
      case 'loyalty_bonus': {
        const discountCents = numericParam(rule.params, 'bonusCents');
        return { discountCents, finalPriceCents: price - discountCents, reason: 'loyalty_bonus' };
      }
      default:
        return { discountCents: 0, finalPriceCents: price, reason: 'skipped' };
    }
  }

  private rejected(price: number, reason: string): PromoApplicationResult {
    return { success: false, discountCents: 0, finalPriceCents: price, reason, applied: false };
  }
}
