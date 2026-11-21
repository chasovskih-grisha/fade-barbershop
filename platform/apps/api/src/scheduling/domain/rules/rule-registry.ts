/* eslint-disable max-lines -- cohesive module (117 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { RuleDefinition, RuleType } from './rule-types';

export type { RuleDefinition, RuleType } from './rule-types';

/** In-memory rule registry with CRUD operations and versioning. */
export class RuleRegistry {
  private rules: Map<string, RuleDefinition> = new Map();
  private nextId = 1;

  /** Create a new rule definition. */
  create(overrides: Partial<RuleDefinition>): RuleDefinition {
    const rule: RuleDefinition = {
      id: `rule-${this.nextId++}`,
      type: overrides.type || 'booking',
      name: overrides.name || 'Unnamed rule',
      expression: overrides.expression || 'true',
      version: overrides.version ?? 1,
      activeFrom: overrides.activeFrom ?? new Date(),
      ...(overrides.activeUntil === undefined ? {} : { activeUntil: overrides.activeUntil }),
      draft: overrides.draft ?? false,
    };
    this.rules.set(rule.id, rule);
    return rule;
  }

  /** Get a rule by ID. */
  get(id: string): RuleDefinition | undefined {
    return this.rules.get(id);
  }

  /** Get all rules of a given type. */
  getByType(type: RuleType): RuleDefinition[] {
    return Array.from(this.rules.values()).filter((r) => r.type === type);
  }

  /** Update an existing rule. */
  update(id: string, overrides: Partial<RuleDefinition>): RuleDefinition | undefined {
    const existing = this.rules.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...overrides };
    this.rules.set(id, updated);
    return updated;
  }

  /** Remove a rule. */
  remove(id: string): boolean {
    return this.rules.delete(id);
  }

  /** Get all rules. */
  getAll(): RuleDefinition[] {
    return Array.from(this.rules.values());
  }

  /** Count rules by type. */
  countByType(type: RuleType): number {
    return Array.from(this.rules.values()).filter((r) => r.type === type).length;
  }

  /** Check if a rule with given type exists. */
  exists(type: RuleType): boolean {
    return Array.from(this.rules.values()).some((r) => r.type === type);
  }

  /** Seed with default rules for each rule type. */
  seedDefaults(): void {
    const defaults: Partial<RuleDefinition>[] = [
      // Booking rules
      {
        type: 'booking' as RuleType,
        name: 'Booking window open',
        expression: 'and([greaterThan([hoursUntilSlot], 0), equal([depositPaid], false)])',
      },
      {
        type: 'booking' as RuleType,
        name: 'Maximum advance booking',
        expression: 'lessThan([hoursUntilSlot], 336)', // 14 days
      },
      // Cancellation rules
      {
        type: 'cancellation' as RuleType,
        name: 'Free cancellation window',
        expression: 'greaterThanOrEqual([hoursUntilSlot], 24)',
      },
      {
        type: 'cancellation' as RuleType,
        name: 'High-risk client deposit required',
        expression: 'greaterThan([clientNoShowCount], 2)',
      },
      // Loyalty rules
      {
        type: 'loyalty' as RuleType,
        name: 'Tier qualification',
        expression: 'greaterThanOrEqual([clientNoShowCount], 0)', // always true baseline
      },
      {
        type: 'loyalty' as RuleType,
        name: 'Cashback eligibility',
        expression: 'greaterThan([depositPaid], 0)',
      },
      // Pricing rules
      {
        type: 'pricing' as RuleType,
        name: 'Peak hour surcharge',
        expression: 'greaterThan([hoursUntilSlot], 24) && lessThan([hoursUntilSlot], 48)',
      },
      {
        type: 'pricing' as RuleType,
        name: 'Last-minute discount',
        expression: 'lessThan([hoursUntilSlot], 2)',
      },
      // Deposit rules
      {
        type: 'deposit' as RuleType,
        name: 'High-risk client deposit',
        expression: 'greaterThan([clientNoShowCount], 2)',
      },
      // No-show rules
      {
        type: 'no-show' as RuleType,
        name: 'Excuse allowed within window',
        expression: 'lessThan([clientNoShowCount], 3)',
      },
      // Commission rules
      {
        type: 'commission' as RuleType,
        name: 'Barber commission eligible',
        expression: 'greaterThan([depositPaid], 0)',
      },
      // Rescheduling rules
      {
        type: 'rescheduling' as RuleType,
        name: 'Free rescheduling window',
        expression: 'greaterThanOrEqual([hoursUntilSlot], 24)',
      },
      // Notification rules
      {
        type: 'notification' as RuleType,
        name: 'Reminder lead time',
        expression: 'greaterThan([hoursUntilSlot], 2)',
      },
    ];

    for (const def of defaults) {
      this.create(def as RuleDefinition);
    }
  }
}
