/* eslint-disable max-lines, complexity, max-statements -- cohesive module (218 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: evaluateCondition, complexity 31 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: evaluateCondition, 37 statements vs 30); extraction tracked in T-2500f */
// Promotion & Discount Engine (T-4553)
// Domain model and JSON Logic rule engine for promotions and discounts.

/** Події, якими може блокувати/ініціювати промо. */
export type PromotionTrigger =
  | 'appointment_booked'
  | 'appointment_completed'
  | 'appointment_cancelled'
  | 'no_show'
  | 'loyalty_tier_reached'
  | 'loyalty_points_earned'
  | 'loyalty_points_spent'
  | 'waitlist_offer_accepted'
  | 'waitlist_offer_declined';

/** JSON Logic умова (уроф). */
export interface JsonCondition {
  op: string;
  [key: string]: unknown;
}

/** JSON Logic результат (true/false). */
export type JsonLogicResult = boolean;

/** Чисельний параметр правила: некоректне значення = 0. */
function numericParam(params: Record<string, unknown>, key: string): number {
  const value = params[key];
  return typeof value === 'number' ? value : 0;
}

/** Список вкладених умов `and`/`or`. */
function conditionList(value: unknown): JsonCondition[] {
  return Array.isArray(value) ? (value as JsonCondition[]) : [];
}

/** Промо-код / промо-представлення. */
export interface PromoCode {
  id: string;
  code: string;
  /** Виkind: 'percent' | 'fixed' */ kind: 'percent' | 'fixed';
  value: { percent?: number; amount?: number }; // amount in cents
  active: boolean;
  maxUses?: number;
  usesCount: number;
  expiresAt?: Date;
}

/** Результат застосування промо. */
export interface PromoApplicationResult {
  success: boolean;
  discountCents: number; // скидка у копійках (маожу бути негативною для нарахувань)
  finalPriceCents: number; // кінцева ціна після скидки
  reason: string; // чому застосувалося/не застосувалося
  applied: boolean;
}

/** Подія події промо. */
export interface PromotionEvent {
  trigger: PromotionTrigger;
  clientId: string;
  /** Додаткові дані, залежно від тригера. */
  payload: Record<string, unknown>;
  /** Чому спрацювало (або не спрацювало). */
  reason?: string;
}

/** Налаштування promо engine. */
export interface PromotionEngineConfig {
  /** Максимальна знижка у % (кап). */ capPercent?: number;
  /** Чомусумна знижка ≤ 100%. */ maxTotalDiscountPercent?: number;
  /** Чомудіа на клієнта на добу. */ maxPerClientPerDay?: number;
}

/** Результат оцінки промо. */
export interface PromoEvaluation {
  applicable: boolean;
  reason: string;
  discountCents: number;
  finalPriceCents: number;
}

/** Порти promocion engine. */
export interface PromotionPorts {
  /** Отримати активний промо-код за кодом. */
  getPromoCode(code: string): Promise<PromoCode | null>;
  /** Перевірити, чи можна застосувати промо до клієнта. */
  canApply(
    clientId: string,
    promoCode: PromoCode,
    context: Record<string, unknown>
  ): Promise<boolean>;
  /** Застосувати промо та розрахувати ціну. */
  apply(
    promoCode: PromoCode,
    agreedPriceCents: number,
    context: Record<string, unknown>
  ): Promise<PromoApplicationResult>;
  /** Оцінити подію для тригера промо. */
  evaluateEvent(event: PromotionEvent, config: PromotionEngineConfig): Promise<PromoEvaluation>;
}

/** Інтерфейс реєстру промо-правил. */
export interface PromotionRule {
  id: string;
  name: string;
  trigger: PromotionTrigger;
  condition: JsonCondition; // JSON Logic умова
  priority: number; // вище = спочатку
  action: 'discount' | 'free_visit' | 'loyalty_bonus' | 'none';
  params: Record<string, unknown>;
}

/** Реєстр промо-правил. */
export class PromotionRegistry {
  private rules: PromotionRule[] = [];

  /** Додати правило в реєстр. */
  addRule(rule: PromotionRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority); // сортуємо за пріоритетом (вище перший)
  }

  /** Отримати правила для даного тригера. */
  getRulesForTrigger(trigger: PromotionTrigger): PromotionRule[] {
    return this.rules.filter((rule) => rule.trigger === trigger);
  }

  /** Оцінити все правила для події. */
  evaluate(event: PromotionEvent, _config: PromotionEngineConfig): PromoEvaluation {
    const applicableRules = this.getRulesForTrigger(event.trigger).filter((rule) =>
      this.evaluateCondition(rule.condition, event.payload)
    );

    // Вибираємо найвищий пріоритетне правило (вже відсортоване).
    const rule = applicableRules[0];
    if (!rule) {
      return {
        applicable: false,
        reason: 'no_applicable_rules',
        discountCents: 0,
        finalPriceCents: 0,
      };
    }

    // Розраховуємо знижку на основі параметрів правила
    let discountCents = 0;
    let finalPriceCents = 0;
    let reason = '';

    switch (rule.action) {
      case 'discount': {
        const percent = numericParam(rule.params, 'percent');
        const amountCents = numericParam(rule.params, 'amountCents');
        // Використовуємо відсоток або фіксовану суму
        if (percent > 0) {
          discountCents = Math.floor((percent / 100) * 10000); // припустимо 10000 ₴ як ADR
          finalPriceCents = 10000 - discountCents;
        } else if (amountCents > 0) {
          discountCents = amountCents;
          finalPriceCents = 10000 - amountCents;
        }
        reason = `promo_${rule.id}_applied`;
        break;
      }
      case 'free_visit': {
        discountCents = 10000; // 100% - behaviour price
        finalPriceCents = 0;
        reason = `promo_${rule.id}_free_visit`;
        break;
      }
      case 'loyalty_bonus': {
        const bonusCents = numericParam(rule.params, 'bonusCents');
        discountCents = bonusCents;
        finalPriceCents = 10000 - bonusCents;
        reason = `promo_${rule.id}_loyalty_bonus`;
        break;
      }
      default:
        reason = 'no_discount_action';
    }

    return {
      applicable: true,
      reason,
      discountCents,
      finalPriceCents,
    };
  }

  /** Оцінути JSON Logic умову. */
  evaluateCondition(condition: JsonCondition, payload: Record<string, unknown>): boolean {
    const { op, ...rest } = condition;

    switch (op) {
      case '==': {
        const left = rest.left;
        const right = rest.right;
        if (typeof left === 'string' && typeof right === 'string') {
          return left.toLowerCase() === right.toLowerCase();
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return left === right;
        }
        return left === right;
      }

      case '!=': {
        const left = rest.left;
        const right = rest.right;
        if (typeof left === 'string' && typeof right === 'string') {
          return left.toLowerCase() !== right.toLowerCase();
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return left !== right;
        }
        return left !== right;
      }

      case '>': {
        const left = typeof rest.left === 'number' ? rest.left : 0;
        const right = typeof rest.right === 'number' ? rest.right : 0;
        return left > right;
      }

      case '<': {
        const left = typeof rest.left === 'number' ? rest.left : 0;
        const right = typeof rest.right === 'number' ? rest.right : 0;
        return left < right;
      }

      case '>=': {
        const left = typeof rest.left === 'number' ? rest.left : 0;
        const right = typeof rest.right === 'number' ? rest.right : 0;
        return left >= right;
      }

      case '<=': {
        const left = typeof rest.left === 'number' ? rest.left : 0;
        const right = typeof rest.right === 'number' ? rest.right : 0;
        return left <= right;
      }

      case 'in': {
        const value = rest.value;
        const list = Array.isArray(rest.list) ? rest.list : [];
        return list.some((item: unknown) => {
          if (typeof value === 'string' && typeof item === 'string') {
            return value.toLowerCase() === item.toLowerCase();
          }
          return false;
        });
      }

      case 'and': {
        return conditionList(rest.conditions).every((c) => this.evaluateCondition(c, payload));
      }

      case 'or': {
        return conditionList(rest.conditions).some((c) => this.evaluateCondition(c, payload));
      }

      case 'not': {
        const nested = rest.condition;
        if (
          !nested ||
          typeof nested !== 'object' ||
          typeof (nested as JsonCondition).op !== 'string'
        ) {
          return false;
        }
        return !this.evaluateCondition(nested as JsonCondition, payload);
      }

      default:
        return false;
    }
  }
}
