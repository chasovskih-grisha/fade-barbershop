// Застосування surge до ціни слота (T-4811): читає активні правила локації й
// рахує ціну. Снепшот множника повертається разом із ціною — він фіксується
// на Booking, тож «чому клієнт заплатив стільки» видно через рік.
import { applySurge, matchSurgeRule, type SeniorityTier, type SurgeRule } from '../domain/surge-rule';

export const SURGE_RULE_STORE = 'SURGE_RULE_STORE';

export interface SurgeRuleStore {
  /** Активні правила локації + мережеві (locationId = null). */
  activeRules(locationId: string): Promise<SurgeRule[]>;
}

export interface SurgeQuoteInput {
  locationId: string;
  start: Date;
  basePrice: number;
  seniorityTier?: SeniorityTier | null;
}

export interface SurgeQuote {
  /** Застосований множник; 10000 — без surge. */
  multiplierBp: number;
  ruleId: string | null;
  /** Надбавка в копійках (0 без surge). */
  amount: number;
  /** Ціна після множника. */
  price: number;
}

export const NO_SURGE_BP = 10_000;

export class SurgePricing {
  constructor(private readonly store: SurgeRuleStore) {}

  async quote(input: SurgeQuoteInput): Promise<SurgeQuote> {
    const rules = await this.store.activeRules(input.locationId);
    const rule = matchSurgeRule(rules, {
      locationId: input.locationId,
      start: input.start,
      ...(input.seniorityTier ? { seniorityTier: input.seniorityTier } : {}),
    });
    if (!rule) {
      return { multiplierBp: NO_SURGE_BP, ruleId: null, amount: 0, price: input.basePrice };
    }
    const price = applySurge(input.basePrice, rule.multiplierBp);
    return {
      multiplierBp: rule.multiplierBp,
      ruleId: rule.id,
      amount: price - input.basePrice,
      price,
    };
  }
}
