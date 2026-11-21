/* eslint-disable max-lines -- cohesive module (203 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import type { RuleContext } from '../../scheduling/domain/rules/rule-types';

/** Promotion types. */
export type PromotionType = 'code' | 'automatic' | 'vip' | 'membership' | 'loyalty';

/** Promotion rule definition linked to JSON Logic rule. */
export interface PromotionRule {
  id: string;
  type: PromotionType;
  name: string;
  jsonLogicExpression: string; // JSON Logic expression from T-4556 RuleEngine
  version?: number;
  activeFrom?: Date;
  activeUntil?: Date | undefined;
  draft?: boolean;
  stackingPriority?: number; // Lower number = higher priority
  capPercent?: number | undefined; // Max discount percentage this promotion can provide
}

/** Promotion configuration limits. */
export interface PromotionLimits {
  /** Max total discount percentage across all stacking layers */
  maxTotalPercent: number;
  /** Max uses per client */
  perClientLimit: number;
  /** Max uses globally */
  globalLimit?: number;
  /** Validity start */
  validFrom?: Date;
  /** Validity end */
  validUntil?: Date;
}

/** Promotion evaluation context. */
export interface PromotionContext {
  /** Base price before any discounts */
  basePrice: number;
  /** Whether client has completed at least one visit */
  hasCompletedVisit: boolean;
  /** Current time */
  now: Date;
  /** Slot start time */
  slotStart: Date;
  /** Selected service ID (optional) */
  serviceId?: string;
  /** Client ID */
  clientId: string;
  /** Loyalty tier (optional) */
  loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  /** Active membership (optional) */
  membershipId?: string;
  /** Whether promo code is being applied (optional) */
  isPromoCode?: boolean;
  /** Additional context for JSON Logic */
  [key: string]: unknown;
}

/** Promotion evaluation result. */
export interface PromotionResult {
  /** Whether promotion is applicable */
  applicable: boolean;
  /** Discount amount in cents (or 0 if not applicable) */
  discountCents: number;
  /** Discount percentage */
  discountPercent: number;
  /** Final price after discount */
  finalPrice: number;
  /** Reason if not applicable */
  reason?: string;
  /** Which promotion layer was applied */
  appliedLayer?: PromotionType;
  /** Promotion rule ID that was evaluated */
  ruleId?: string;
  /** Promotion usage log entry */
  usageLog?: {
    promotionId: string;
    clientId: string;
    basePrice: number;
    discountCents: number;
    finalPrice: number;
    evaluatedAt: Date;
  };
}

/** In-memory promotion registry. */
export class PromotionRegistry {
  private promotions: Map<string, PromotionRule> = new Map();
  private nextId = 1;

  create(overrides: Partial<PromotionRule>): PromotionRule {
    const promotion: PromotionRule = {
      id: `promo-${this.nextId++}`,
      type: overrides.type || 'automatic',
      name: overrides.name || 'Unnamed promotion',
      jsonLogicExpression: overrides.jsonLogicExpression || 'true',
      version: overrides.version ?? 1,
      activeFrom: overrides.activeFrom ?? new Date(),
      ...(overrides.activeUntil !== undefined ? { activeUntil: overrides.activeUntil } : {}),
      draft: overrides.draft ?? false,
      stackingPriority: overrides.stackingPriority ?? 100,
      ...(overrides.capPercent !== undefined ? { capPercent: overrides.capPercent } : {}),
    };
    this.promotions.set(promotion.id, promotion);
    return promotion;
  }

  get(id: string): PromotionRule | undefined {
    return this.promotions.get(id);
  }

  getByType(type: PromotionType): PromotionRule[] {
    return Array.from(this.promotions.values()).filter((p) => p.type === type);
  }

  getActive(): PromotionRule[] {
    const now = new Date();
    return Array.from(this.promotions.values()).filter((p) => {
      const activeFrom = p.activeFrom ? new Date(p.activeFrom) : new Date(0);
      const activeUntil = p.activeUntil ? new Date(p.activeUntil) : new Date(Infinity);
      return now >= activeFrom && now <= activeUntil && !p.draft;
    });
  }

  getStackingLayers(): PromotionRule[] {
    // Return promotions sorted by stacking priority (lower = higher priority)
    return this.getActive().sort(
      (a, b) => (a.stackingPriority ?? 100) - (b.stackingPriority ?? 100)
    );
  }

  evaluate(
    type: PromotionType,
    context: PromotionContext,
    ruleEngine: import('../../scheduling/domain/rules/rule-types').RuleEngine
  ): PromotionResult {
    const promotion = this.getByType(type)[0];
    if (!promotion) {
      return {
        applicable: false,
        discountCents: 0,
        discountPercent: 0,
        finalPrice: context.basePrice,
      };
    }

    // Check validity dates
    const now = context.now;
    const activeFrom = new Date(promotion.activeFrom ?? now);
    const activeUntil = promotion.activeUntil
      ? new Date(promotion.activeUntil)
      : new Date(Infinity);
    if (now < activeFrom || now > activeUntil) {
      return {
        applicable: false,
        discountCents: 0,
        discountPercent: 0,
        finalPrice: context.basePrice,
        reason: 'Promotion not active',
      };
    }

    // Evaluate JSON Logic expression using RuleEngine
    const ruleContext: RuleContext = {
      hoursUntilSlot: 0, // would be computed from slotStart vs now
      clientNoShowCount: 0,
      depositPaid: false,
      policyConfig: undefined,
      appointmentStart: context.slotStart,
      now: context.now,
      true: true,
      false: false,
      null: null,
    };

    // Add promotion-specific context variables
    const enhancedContext: Record<string, unknown> = {
      ...ruleContext,
      basePrice: context.basePrice,
      hasCompletedVisit: context.hasCompletedVisit,
      slotStart: context.slotStart,
      now: context.now,
      serviceId: context.serviceId,
      clientId: context.clientId,
      loyaltyTier: context.loyaltyTier,
      membershipId: context.membershipId,
      isPromoCode: context.isPromoCode,
    };

    try {
      const evaluated = ruleEngine.evaluateExpression(
        promotion.jsonLogicExpression,
        enhancedContext
      );
      const allowed = evaluated === true || evaluated === 'true';

      if (allowed) {
        // Calculate discount based on value type
        // This is simplified - real implementation would parse the DiscountValue from the expression result
        const discountPercent = 10; // placeholder - would come from expression evaluation
        const discountCents = Math.round((context.basePrice * discountPercent) / 100);
        const finalPrice = Math.max(0, context.basePrice - discountCents);

        return {
          applicable: true,
          discountCents,
          discountPercent,
          finalPrice,
          appliedLayer: type,
          ruleId: promotion.id,
        };
      } else {
        return {
          applicable: false,
          discountCents: 0,
          discountPercent: 0,
          finalPrice: context.basePrice,
          reason: 'Promotion condition not met',
        };
      }
    } catch {
      return {
        applicable: false,
        discountCents: 0,
        discountPercent: 0,
        finalPrice: context.basePrice,
        reason: 'Error evaluating promotion',
      };
    }
  }

  /** Evaluate all stacking layers for a given base price. */
  evaluateStacking(
    basePrice: number,
    context: PromotionContext,
    ruleEngine: import('../../scheduling/domain/rules/rule-types').RuleEngine
  ): { layers: PromotionResult[]; totalDiscountCents: number; finalPrice: number } {
    const results: PromotionResult[] = [];
    let totalDiscountCents = 0;
    let currentPrice = basePrice;

    for (const layer of this.getStackingLayers()) {
      const result = this.evaluate(layer.type, context, ruleEngine);
      if (result.applicable) {
        const uncapped = discountCentsFromPercent(result.discountPercent, currentPrice);
        const layerCap = layer.capPercent
          ? Math.min(uncapped, Math.round((currentPrice * layer.capPercent) / 100))
          : uncapped;
        totalDiscountCents += layerCap;
        currentPrice -= layerCap;
        result.discountCents = layerCap;
      }
      results.push(result);
    }

    return { layers: results, totalDiscountCents, finalPrice: Math.max(0, currentPrice) };
  }
}

/** Helper to convert discount percent to cents. */
function discountCentsFromPercent(percent: number, price: number): number {
  return Math.round((price * percent) / 100);
}
