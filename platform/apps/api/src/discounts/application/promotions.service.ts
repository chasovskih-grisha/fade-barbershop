/* eslint-disable max-lines -- cohesive module (108 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { Injectable } from '@nestjs/common';
import { RuleEngine } from '../../scheduling/domain/rules/rule-types';
import {
  PromotionRegistry,
  type PromotionContext,
  type PromotionResult,
  type PromotionType,
} from '../domain/promotion.entity';
import { evaluatePromoCode } from '../domain/promo-code';

/** Promotion engine over the JSON Logic rule engine — T-4553/T-4556. */
@Injectable()
export class PromotionsService {
  private readonly registry: PromotionRegistry;
  private readonly ruleEngine = new RuleEngine();

  constructor(registry?: PromotionRegistry) {
    this.registry = registry ?? new PromotionRegistry();
    this.seedDefaultPromotions();
  }

  /** Seed default promotions for each type. */
  seedDefaultPromotions(): void {
    const defaults: Array<
      Pick<
        PromotionContextSeed,
        'type' | 'name' | 'jsonLogicExpression' | 'stackingPriority' | 'capPercent'
      >
    > = [
      {
        type: 'automatic',
        name: 'First visit discount',
        jsonLogicExpression:
          'and([equal([hasCompletedVisit], false), greaterThan([basePrice], 0)])',
        stackingPriority: 1,
        capPercent: 15,
      },
      {
        type: 'automatic',
        name: 'Off-peak hours discount',
        jsonLogicExpression: 'and([greaterThan([minuteOfDay], 360), lessThan([minuteOfDay], 540)])',
        stackingPriority: 2,
        capPercent: 10,
      },
      {
        type: 'vip',
        name: 'VIP loyalty discount',
        jsonLogicExpression: 'greaterThan([loyaltyTier], "BRONZE")',
        stackingPriority: 3,
        capPercent: 20,
      },
      {
        type: 'membership',
        name: 'Membership discount',
        jsonLogicExpression: 'greaterThan([membershipId], "")',
        stackingPriority: 4,
        capPercent: 25,
      },
      {
        type: 'loyalty',
        name: 'Loyalty points discount',
        jsonLogicExpression: 'greaterThan([loyaltyTier], "SILVER")',
        stackingPriority: 5,
        capPercent: 15,
      },
      {
        type: 'code',
        name: 'Promo code discount',
        jsonLogicExpression: 'true',
        stackingPriority: 6,
        capPercent: 30,
      },
    ];

    for (const seed of defaults) this.registry.create(seed);
  }

  /** Evaluate a single promotion layer. */
  evaluatePromotion(type: PromotionType, context: PromotionContext): PromotionResult {
    return this.registry.evaluate(type, context, this.ruleEngine);
  }

  /** Evaluate all stacking layers and return final price. */
  evaluateStacking(
    basePrice: number,
    context: PromotionContext
  ): { layers: PromotionResult[]; totalDiscountCents: number; finalPrice: number } {
    return this.registry.evaluateStacking(basePrice, context, this.ruleEngine);
  }

  /** Validate a promo code and return its evaluation (no DB lookup in this engine). */
  validatePromoCode(
    _code: string,
    context: PromotionContext
  ): { valid: boolean; discountCents: number; discountPercent: number; message: string } {
    const evaluation = evaluatePromoCode({
      code: null,
      now: context.now,
      ...(context.serviceId !== undefined ? { serviceId: context.serviceId } : {}),
    });

    if (!evaluation.valid || !evaluation.source) {
      return { valid: false, discountCents: 0, discountPercent: 0, message: evaluation.message };
    }

    const source = evaluation.source;
    const discountCents =
      source.percent !== undefined
        ? Math.round((context.basePrice * source.percent) / 100)
        : (source.amount ?? 0);
    const discountPercent =
      context.basePrice > 0 ? Math.round((discountCents * 100) / context.basePrice) : 0;
    return { valid: true, discountCents, discountPercent, message: evaluation.message };
  }
}

/** Seed-конфігурація правила (підмножина PromotionRule, що задається вручну). */
type PromotionContextSeed = {
  type: PromotionType;
  name: string;
  jsonLogicExpression: string;
  stackingPriority: number;
  capPercent: number;
};
