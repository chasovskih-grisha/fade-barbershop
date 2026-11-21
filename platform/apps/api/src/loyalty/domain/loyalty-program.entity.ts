import { SubscriptionConfig } from '../loyalty.dto';

/* eslint-disable max-lines, complexity, max-params -- cohesive module (390 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 3 functions with inherent domain branching (worst: evaluateJsonLogic, complexity 21 vs 10); refactor tracked in T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: applyAccrual, limit 3); API redesign tracked in T-2500f */
/** Loyalty program types. */
export type LoyaltyProgramType = 'points' | 'cashback' | 'vip' | 'hybrid';

/** Earn rule types. */
export type EarnRuleType = 'visit' | 'spend' | 'referral' | 'birthday' | 'review' | 'custom';

/** Spend rule types. */
export type SpendRuleType = 'minimum_balance' | 'percentage_of_check' | 'fixed_amount' | 'custom';

/** Loyalty program configuration (T-4450).
 * Unified configuration for loyalty rules: accrual scheme, minimum threshold,
 * expiration limits, redemption rules, with per-location overrides.
 */
export interface LoyaltyProgramConfig {
  /** Unique program identifier */
  id: string;
  /** Program name */
  name: string;
  /** Accrual scheme: how points are earned */
  accrualScheme: 'points_per_uah' | 'cashback_percent' | 'hybrid';
  /** Points earned per base UAH spent (or per visit for visit-type) */
  pointsPerUah: number;
  /** Cashback percent of check amount */
  cashbackPercent: number;
  /** Minimum threshold for participation (minimum spend to earn points) */
  minimumThreshold: { minAmountUah: number; perVisit: boolean };
  /** Expiration limits */
  expiration: { enabled: boolean; defaultDays?: number; maxDays?: number };
  /** Stacking priority (lower = higher priority) */
  stackingPriority: number;
  /** Max cashback % of check (cap, DSC-003) */
  maxCashbackPercent?: number;
  /** Whether program is active */
  active: boolean;
  /** Earning rules (each carries a JSON Logic expression). */
  earnRules: {
    id: string;
    programId: string;
    ruleType: EarnRuleType;
    jsonLogicExpression: string;
    multiplier: number;
    minThreshold?: number;
    maxCap?: number;
    active: boolean;
  }[];
  /** Spending rules (each carries a JSON Logic expression). */
  spendRules: {
    id: string;
    programId: string;
    ruleType: SpendRuleType;
    jsonLogicExpression: string;
    minBalanceRequired: number;
    maxPercentOfCheck?: number;
    fixedAmount?: number;
    active: boolean;
  }[];
  /** Per-location overrides (optional) */
  locationOverrides?: Record<string, Partial<LoyaltyProgramConfig>>;
  /** Subscription pass configuration (T-5008) */
  subscription?: SubscriptionConfig;
}

/** Loyalty program definition. */
export interface LoyaltyProgram {
  id: string;
  name: string;
  type: LoyaltyProgramType;
  /** Points earned per base UAH spent (or per visit for visit-type) */
  pointsPerUah: number;
  /** Cashback percent of check amount */
  cashbackPercent: number;
  /** Accumulation before tier upgrade progress tracking */
  tierProgressPerUah: number;
  /** Active from date */
  activeFrom: Date;
  /** Active until date (optional - undefined = ongoing) */
  activeUntil?: Date;
  /** Whether program is active */
  active: boolean;
  /** Earning rules (each carries a JSON Logic expression). */
  earnRules: EarnRule[];
  /** Spending rules (each carries a JSON Logic expression). */
  spendRules: SpendRule[];
  /** Stacking priority (lower = higher priority) */
  stackingPriority: number;
  /** Max cashback % of check (cap, DSC-003) */
  maxCashbackPercent?: number;
  /** Whether points can expire */
  allowExpiration: boolean;
  /** Default expiration days after inactivity */
  defaultExpirationDays?: number;
  /** Configuration (T-4450) - unified settings */
  config?: LoyaltyProgramConfig;
  /** Subscription pass configuration (T-5008) */
  subscription?: SubscriptionConfig;
}

/** Loyalty account (per client + program). */
export interface LoyaltyAccount {
  id: string;
  clientId: string;
  programId: string;
  /** Current points balance */
  pointsBalance: number;
  /** Current cashback balance in UAH */
  cashbackBalance: number;
  /** Current tier (Bronze/Silver/Gold/Platinum) */
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  /** Tier progress (0-100%) toward next tier */
  tierProgress: number;
  /** Last activity timestamp (for expiration) */
  lastActivity: Date;
  /** Total points earned lifetime */
  totalPointsEarned: number;
  /** Total cashback earned lifetime */
  totalCashbackEarned: number;
  /** Total points spent lifetime */
  totalPointsSpent: number;
}

/** Loyalty transaction type. */
export type LoyaltyTransactionType = 'EARN' | 'SPEND' | 'EXPIRE' | 'ADJUST';

/** Loyalty transaction record. */
export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  type: LoyaltyTransactionType;
  amount: number; // positive for EARN/ADJUST, negative for SPEND/EXPIRE
  description: string;
  /** Linked appointment ID (optional) */
  appointmentId?: string;
  /** Linked payment ID (optional) */
  paymentId?: string;
  /** Linked campaign ID (optional) */
  campaignId?: string;
  /** Linked referral ID (optional) */
  referralId?: string;
  /** Created at */
  createdAt: Date;
  /** Reason for the transaction */
  reason?: string;
}

/** Earning rule configuration. */
export interface EarnRule {
  id: string;
  programId: string;
  ruleType: EarnRuleType;
  jsonLogicExpression: string;
  /** Multiplier applied to base calculation */
  multiplier: number;
  /** Minimum threshold for the rule to apply */
  minThreshold?: number;
  /** Maximum cap for this rule */
  maxCap?: number;
  /** Whether rule is active */
  active: boolean;
}

/** Spending rule configuration. */
export interface SpendRule {
  id: string;
  programId: string;
  ruleType: SpendRuleType;
  jsonLogicExpression: string;
  /** Minimum balance required before spend */
  minBalanceRequired: number;
  /** Max % of check that can be covered */
  maxPercentOfCheck: number;
  /** Whether rule is active */
  active: boolean;
}

/** Tier benefit configuration. */
export interface TierBenefit {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  /** Higher cashback percentage for this tier */
  cashbackPercentBonus: number;
  /** Free add-ons included */
  freeAddons: string[];
  /** Priority waitlist positioning */
  waitlistPriorityBoost: number;
  /** Exclusive service access */
  exclusiveServices: string[];
}

/** Tier calculation result. */
export interface TierCalculationResult {
  /** New tier assignment */
  newTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  /** Tier progress percentage (0-100) */
  progress: number;
  /** Whether tier was upgraded */
  wasUpgraded: boolean;
  /** Whether tier was downgraded */
  wasDowngraded: boolean;
  /** Reason for tier change */
  reason?: string;
}

/** Loyalty points accrual calculation. */
export interface PointsAccrual {
  /** Base points to award */
  points: number;
  /** Cashback amount in UAH */
  cashback: number;
  /** Which rules applied */
  appliedRules: string[];
  /** Final multiplier after all conditions */
  finalMultiplier: number;
}

/** Balance update result. */
export interface BalanceUpdateResult {
  /** New points balance */
  newPointsBalance: number;
  /** New cashback balance */
  newCashbackBalance: number;
  /** Points earned this update */
  pointsEarned: number;
  /** Cashback earned this update */
  cashbackEarned: number;
  /** Tier change result */
  tierChange: TierCalculationResult;
  /** Applied rule ids */
  appliedRules: string[];
}

/* eslint-disable max-lines, complexity, max-params -- cohesive module (390 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 3 functions with inherent domain branching (worst: evaluateJsonLogic, complexity 21 vs 10); refactor tracked in T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: applyAccrual, limit 3); API redesign tracked in T-2500f */
/** In-memory loyalty registry. */
export class LoyaltyRegistry {
  private readonly programs: Map<string, LoyaltyProgram> = new Map();
  private readonly accounts: Map<string, LoyaltyAccount> = new Map();
  private programIdCounter = 1;
  private accountIdCounter = 1;

  /** Seed default earn rules for a program. */
  private seedDefaultEarnRules(program: LoyaltyProgram): void {
    // Default: earn points per UAH spent
    program.earnRules = [
      {
        id: 'rule-visit-' + program.id,
        programId: program.id,
        ruleType: 'visit' as EarnRuleType,
        jsonLogicExpression: 'true',
        multiplier: 1,
        active: true,
      },
      // Birthday bonus: 50% extra points
      {
        id: 'rule-birthday-' + program.id,
        programId: program.id,
        ruleType: 'birthday' as EarnRuleType,
        jsonLogicExpression: 'and([isBirthday, greaterThan([baseAmount], 0)])',
        multiplier: 1.5,
        active: true,
      },
      // Review reward: 100 points
      {
        id: 'rule-review-' + program.id,
        programId: program.id,
        ruleType: 'review' as EarnRuleType,
        jsonLogicExpression: 'isReview',
        multiplier: 1,
        active: true,
      },
    ];
  }

  /** Seed default spend rules for a program. */
  private seedDefaultSpendRules(program: LoyaltyProgram): void {
    // Default: spend minimum 100 UAH cashback for 10% of check
    program.spendRules = [
      {
        id: 'rule-min-balance-' + program.id,
        programId: program.id,
        ruleType: 'minimum_balance' as SpendRuleType,
        jsonLogicExpression: 'true',
        minBalanceRequired: 100,
        maxPercentOfCheck: 10,
        active: true,
      },
    ];
  }

  createProgram(overrides: Partial<LoyaltyProgram>): LoyaltyProgram {
    const program: LoyaltyProgram = {
      id: `prog-${String(this.programIdCounter++).padStart(3, '0')}`,
      name: overrides.name || 'Unnamed Program',
      type: overrides.type || 'points',
      pointsPerUah: overrides.pointsPerUah ?? 10,
      cashbackPercent: overrides.cashbackPercent ?? 0,
      tierProgressPerUah: overrides.tierProgressPerUah ?? 1,
      activeFrom: overrides.activeFrom ?? new Date(),
      ...(overrides.activeUntil !== undefined ? { activeUntil: overrides.activeUntil } : {}),
      active: overrides.active !== false,
      earnRules: [],
      spendRules: [],
      stackingPriority: overrides.stackingPriority ?? 100,
      ...(overrides.maxCashbackPercent !== undefined
        ? { maxCashbackPercent: overrides.maxCashbackPercent }
        : {}),
      allowExpiration: overrides.allowExpiration ?? false,
      ...(overrides.defaultExpirationDays !== undefined
        ? { defaultExpirationDays: overrides.defaultExpirationDays }
        : {}),
    };

    // Seed default rules
    this.seedDefaultEarnRules(program);
    this.seedDefaultSpendRules(program);

    this.programs.set(program.id, program);
    return program;
  }

  getProgram(id: string): LoyaltyProgram | undefined {
    return this.programs.get(id);
  }

  getProgramByType(type: LoyaltyProgramType): LoyaltyProgram[] {
    return Array.from(this.programs.values()).filter((p) => p.type === type && p.active);
  }

  getActivePrograms(): LoyaltyProgram[] {
    return Array.from(this.programs.values()).filter((p) => p.active);
  }

  getActiveProgramsAndConfig(programId?: string): {
    program: LoyaltyProgram | undefined;
    config: LoyaltyProgramConfig | undefined;
  } {
    const program = programId ? this.getProgram(programId) : undefined;
    const config = program ? this.getProgramConfig(program.id) : undefined;
    return { program, config };
  }

  createAccount(clientId: string, programId: string): LoyaltyAccount {
    const program = this.getProgram(programId);
    if (!program) {
      throw new Error(`Loyalty program ${programId} not found`);
    }

    const account: LoyaltyAccount = {
      id: `acct-${String(this.accountIdCounter++).padStart(3, '0')}`,
      clientId,
      programId,
      pointsBalance: 0,
      cashbackBalance: 0,
      tier: 'BRONZE',
      tierProgress: 0,
      lastActivity: new Date(),
      totalPointsEarned: 0,
      totalCashbackEarned: 0,
      totalPointsSpent: 0,
    };
    this.accounts.set(account.id, account);
    return account;
  }

  getAccount(clientId: string, programId: string): LoyaltyAccount | undefined {
    // Search by composite key
    return Array.from(this.accounts.values()).find(
      (a) => a.clientId === clientId && a.programId === programId
    );
  }

  /** Get program configuration (T-4450). Reads active config or falls back to defaults. */
  getProgramConfig(programId: string): LoyaltyProgramConfig | undefined {
    const program = this.getProgram(programId);
    if (!program) {
      return undefined;
    }
    // Return explicit config if set, otherwise build from program fields
    if (program.config) {
      return program.config;
    }
    // Build default config from program fields
    return {
      id: program.id,
      name: program.name,
      accrualScheme: 'points_per_uah',
      pointsPerUah: program.pointsPerUah,
      cashbackPercent: program.cashbackPercent,
      minimumThreshold: { minAmountUah: 0, perVisit: false },
      expiration: { enabled: program.allowExpiration, defaultDays: program.defaultExpirationDays },
      stackingPriority: program.stackingPriority,
      maxCashbackPercent: program.maxCashbackPercent,
      active: program.active,
      earnRules: program.earnRules,
      spendRules: program.spendRules,
    } as LoyaltyProgramConfig;
  }

  /** Subscription management (T-5008). */
  private readonly subscriptions: Map<string, SubscriptionConfig> = new Map();

  createSubscription(
    clientId: string,
    programId: string,
    init: Partial<SubscriptionConfig>
  ): SubscriptionConfig {
    const subscription: SubscriptionConfig = {
      active: true,
      tier: 'BRONZE',
      monthlyVisitAllowance: init.monthlyVisitAllowance ?? 4,
      allowRollover: init.allowRollover ?? false,
      benefits: {
        cashbackPercentBonus: 0,
        freeAddons: [],
        waitlistPriorityBoost: 0,
        exclusiveServices: [],
      },
      billing: {
        priceUah: init.billing?.priceUah ?? 0,
        billingCycle: init.billing?.billingCycle ?? 'MONTHLY',
        autoRenew: init.billing?.autoRenew ?? true,
      },
      priorityBooking: init.priorityBooking ?? false,
      refundWindowDays: init.refundWindowDays ?? 7,
    };
    this.subscriptions.set(clientId, subscription);
    return subscription;
  }

  getSubscription(clientId: string): SubscriptionConfig | undefined {
    return this.subscriptions.get(clientId);
  }

  pauseSubscription(clientId: string): SubscriptionConfig | undefined {
    const subscription = this.getSubscription(clientId);
    if (!subscription || !subscription.active) {
      return undefined;
    }
    subscription.active = false;
    return subscription;
  }

  upgradeSubscription(
    clientId: string,
    newTier: 'SILVER' | 'GOLD' | 'PLATINUM'
  ): SubscriptionConfig | undefined {
    const subscription = this.getSubscription(clientId);
    if (!subscription) {
      return undefined;
    }
    const tierBonuses: Record<
      'SILVER' | 'GOLD' | 'PLATINUM',
      { cashbackBonus: number; freeAddons: string[]; waitlistBoost: number }
    > = {
      SILVER: { cashbackBonus: 5, freeAddons: ['complimentary_tea'], waitlistBoost: 2 },
      GOLD: {
        cashbackBonus: 15,
        freeAddons: ['complimentary_massage', 'priority_booking'],
        waitlistBoost: 5,
      },
      PLATINUM: {
        cashbackBonus: 30,
        freeAddons: ['complimentary_dermatology_consult', 'extra_priority_booking'],
        waitlistBoost: 10,
      },
    };
    subscription.tier = newTier;
    subscription.benefits.cashbackPercentBonus = tierBonuses[newTier].cashbackBonus;
    subscription.benefits.freeAddons = tierBonuses[newTier].freeAddons;
    subscription.benefits.waitlistPriorityBoost = tierBonuses[newTier].waitlistBoost;
    return subscription;
  }

  cancelSubscription(clientId: string): SubscriptionConfig | undefined {
    const subscription = this.getSubscription(clientId);
    if (!subscription) {
      return undefined;
    }
    subscription.active = false;
    return subscription;
  }

  /** Calculate points and cashback accrual for a visit/payment, respecting config (T-4450). */
  calculateAccrual(
    programId: string,
    baseAmountUah: number,
    context: {
      /** Services included (for service-specific multipliers) */
      serviceIds?: string[];
      /** Whether it's a birthday visit */
      isBirthday: boolean;
      /** Whether it's a review submission */
      isReview: boolean;
      /** Referral source (optional) */
      referralId?: string;
      /** Current time */
      now: Date;
    }
  ): PointsAccrual {
    const program = this.getProgram(programId);
    if (!program) {
      return { points: 0, cashback: 0, appliedRules: [], finalMultiplier: 1 };
    }

    const config = this.getProgramConfig(programId);
    // Use default config if not available (T-4450)
    const effectiveConfig =
      config ??
      this.getProgramConfig(programId) ??
      ({
        id: program.id,
        name: program.name || 'Unnamed',
        accrualScheme: 'points_per_uah' as const,
        pointsPerUah: program.pointsPerUah,
        cashbackPercent: program.cashbackPercent,
        minimumThreshold: { minAmountUah: 0, perVisit: false },
        expiration: {
          enabled: program.allowExpiration,
          defaultDays: program.defaultExpirationDays,
        },
        stackingPriority: program.stackingPriority,
        maxCashbackPercent: program.maxCashbackPercent,
        active: program.active,
        earnRules: program.earnRules,
        spendRules: program.spendRules,
      } as LoyaltyProgramConfig);

    let totalPoints = 0;
    let totalCashback = 0;
    const appliedRules: string[] = [];
    let finalMultiplier = 1;

    // Apply earn rules
    for (const rule of effectiveConfig.earnRules) {
      // Build context for JSON Logic evaluation
      const ruleContext: Record<string, unknown> = {
        baseAmount: baseAmountUah,
        serviceIds: context.serviceIds ?? [],
        isBirthday: context.isBirthday ?? false,
        isReview: context.isReview ?? false,
        referralId: context.referralId,
        pointsPerUah: effectiveConfig.pointsPerUah,
        cashbackPercent: effectiveConfig.cashbackPercent,
        tierProgressPerUah: program.tierProgressPerUah,
        true: true,
        false: false,
        null: null,
      };

      try {
        const evaluated = this.evaluateJsonLogic(rule.jsonLogicExpression, ruleContext);

        if (evaluated) {
          const rulePoints = Math.floor(
            baseAmountUah * effectiveConfig.pointsPerUah * (rule.multiplier ?? 1)
          );
          const ruleCashback = Math.round((baseAmountUah * effectiveConfig.cashbackPercent) / 100);
          totalPoints += rulePoints;
          totalCashback += ruleCashback;
          appliedRules.push(rule.id);
          finalMultiplier *= rule.multiplier ?? 1;
        }
      } catch {
        // Skip rules that fail to evaluate
      }
    }

    // Apply cashback cap if defined in config
    const maxCashbackPercent = effectiveConfig.maxCashbackPercent ?? program.maxCashbackPercent;
    if (maxCashbackPercent && totalCashback > 0) {
      const maxAllowed = Math.round((baseAmountUah * maxCashbackPercent) / 100);
      totalCashback = Math.min(totalCashback, maxAllowed);
    }

    // Apply minimum threshold check: if configured, ensure base amount meets minimum
    const minThreshold = effectiveConfig.minimumThreshold ?? { minAmountUah: 0, perVisit: false };
    if (minThreshold.minAmountUah > 0 && baseAmountUah < minThreshold.minAmountUah) {
      // Below threshold - no points or cashback earned
      return { points: 0, cashback: 0, appliedRules: [], finalMultiplier: 1 };
    }

    return {
      points: totalPoints,
      cashback: totalCashback,
      appliedRules,
      finalMultiplier,
    };
  }

  /** Apply accrual to loyalty account. */
  applyAccrual(
    clientId: string,
    programId: string,
    accrual: PointsAccrual,
    _transactionReason?: string
  ): BalanceUpdateResult {
    const account = this.getAccount(clientId, programId);
    if (!account) {
      throw new Error(`Loyalty account not found for client ${clientId} and program ${programId}`);
    }

    const now = new Date();

    // Update balances
    const newPointsBalance = account.pointsBalance + accrual.points;
    const newCashbackBalance = Math.max(0, account.cashbackBalance + accrual.cashback);

    // Update totals
    const totalPointsEarned = account.totalPointsEarned + accrual.points;
    const totalCashbackEarned = account.totalCashbackEarned + accrual.cashback;

    // Update tier progress
    const tierProgress = Math.min(100, account.tierProgress + Math.round(accrual.points / 10));

    // Tier calculation
    const tierChange = this.calculateTier(account, newPointsBalance, newCashbackBalance);

    // Create transaction record
    this.accountIdCounter++;
    // In a real system, persist this transaction

    // Update account
    account.pointsBalance = newPointsBalance;
    account.cashbackBalance = newCashbackBalance;
    account.lastActivity = now;
    account.totalPointsEarned = totalPointsEarned;
    account.totalCashbackEarned = totalCashbackEarned;
    account.tierProgress = tierProgress;

    return {
      newPointsBalance,
      newCashbackBalance,
      pointsEarned: accrual.points,
      cashbackEarned: accrual.cashback,
      tierChange,
      appliedRules: accrual.appliedRules,
    };
  }

  /** Calculate tier based on accumulated balances. */
  private calculateTier(
    account: LoyaltyAccount,
    pointsBalance: number,
    cashbackBalance: number
  ): TierCalculationResult {
    const tiers: Record<
      'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
      { minPoints: number; minCashback: number }
    > = {
      BRONZE: { minPoints: 0, minCashback: 0 },
      SILVER: { minPoints: 500, minCashback: 100 },
      GOLD: { minPoints: 2000, minCashback: 500 },
      PLATINUM: { minPoints: 5000, minCashback: 1000 },
    };

    let newTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE';
    let progress = 0;

    // Determine current tier based on balances (highest qualifying tier)
    const sortedTiers = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'] as const;

    for (const tier of sortedTiers) {
      const { minPoints, minCashback } = tiers[tier];
      if (pointsBalance >= minPoints && cashbackBalance >= minCashback) {
        newTier = tier;
        break;
      }
    }

    // Calculate progress toward next tier
    const nextTierIndex = sortedTiers.indexOf(newTier);
    if (nextTierIndex < sortedTiers.length - 1) {
      const nextTier = sortedTiers[nextTierIndex + 1];
      if (nextTier) {
        const { minPoints: nextMinPoints, minCashback: nextMinCashback } = tiers[nextTier];
        const totalCurrent = pointsBalance + cashbackBalance;
        progress =
          totalCurrent > 0
            ? Math.min(100, Math.round((totalCurrent / (nextMinPoints + nextMinCashback)) * 100))
            : 0;
      }
    }

    return {
      newTier,
      progress,
      wasUpgraded: false, // would compare with previous tier in full implementation
      wasDowngraded: false,
    };
  }

  /** Evaluate a JSON Logic expression with given context. */
  private evaluateJsonLogic(expression: string, context: Record<string, unknown>): boolean {
    // Simplified JSON Logic evaluation
    try {
      const parsed = JSON.parse(expression);
      if (typeof parsed === 'boolean') {
        return parsed;
      }
      if (typeof parsed === 'number') {
        return parsed !== 0;
      }
      if (typeof parsed === 'string') {
        return parsed.length > 0;
      }
      if (Array.isArray(parsed)) {
        return parsed.some((item: unknown) => this.evaluateJsonLogic(String(item), context));
      }
      if (parsed && typeof parsed === 'object') {
        // Handle JSON Logic operators
        const op = Object.keys(parsed)[0];
        const args = Object.values(parsed)[0] as unknown[];
        switch (op) {
          case 'true':
            return true;
          case 'false':
            return false;
          case 'not':
            return !this.evaluateJsonLogic(String(args[0]), context);
          case 'and':
            return args.every((arg: unknown) => this.evaluateJsonLogic(String(arg), context));
          case 'or':
            return args.some((arg: unknown) => this.evaluateJsonLogic(String(arg), context));
          case '>':
            return (args[0] as number) > (args[1] as number);
          case '<':
            return (args[0] as number) < (args[1] as number);
          case '>=':
            return (args[0] as number) >= (args[1] as number);
          case '<=':
            return (args[0] as number) <= (args[1] as number);
          case '=':
            return String(args[0]) === String(args[1]);
          case 'in':
            return Array.isArray(args[1]) && args[1].includes(args[0]);
          case 'exists':
            return args[0] !== undefined && args[0] !== null;
          default:
            return false;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}
