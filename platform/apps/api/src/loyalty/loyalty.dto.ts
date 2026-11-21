// Loyalty progress output DTO
export class LoyaltyProgressOutput {
  currentVisits: number;
  threshold: number;
  progressPercentage: number;
  nextFreeVisitAt: number;
  isMilestoneReached: boolean;
  freeVisitGranted: boolean;
}

// Get progress output DTO
export class GetProgressOutput {
  success: boolean;
  data: {
    currentVisits: number;
    threshold: number;
    progressPercentage: number;
    nextFreeVisitAt: number;
    isMilestoneReached: boolean;
    freeVisitGranted: boolean;
    clientId: string;
    lastUpdated: Date;
  };
}

// --- Loyalty Program Configuration DTOs (T-4450) ---

// Accrual scheme: how points are earned
export enum AccrualScheme {
  POINTS_PER_UAH = 'points_per_uah',
  CASHBACK_PERCENT = 'cashback_percent',
  HYBRID = 'hybrid',
}

// Rounding mode for accrual calculations
export enum RoundingMode {
  FLOOR = 'floor',
  CEILING = 'ceiling',
  ROUND_HALF_UP = 'round_half_up',
}

// Minimum threshold for participation (minimum spend to earn points)
export interface MinimumThreshold {
  /** Minimum amount in UAH that must be spent to earn points */
  minAmountUah: number;
  /** Whether minimum threshold applies per-visit or per-transaction */
  perVisit: boolean;
}

// Expiration configuration
export interface ExpirationConfig {
  /** Whether points can expire */
  enabled: boolean;
  /** Default expiration days after inactivity */
  defaultDays?: number;
  /** Maximum expiration days (hard cap) */
  maxDays?: number;
}

// Redemption rule for spending discounts
export interface RedemptionRule {
  id: string;
  ruleType: 'minimum_balance' | 'percentage_of_check' | 'fixed_amount';
  /** Minimum balance required before spend */
  minBalanceRequired: number;
  /** Max % of check that can be covered (for percentage rules) */
  maxPercentOfCheck?: number;
  /** Fixed amount discount (for fixed_amount rules) */
  fixedAmount?: number;
  /** Whether rule is active */
  active: boolean;
}

// Loyalty program configuration
export interface LoyaltyProgramConfig {
  /** Unique program identifier */
  id: string;
  /** Program name */
  name: string;
  /** Accrual scheme: how points are earned */
  accrualScheme: AccrualScheme;
  /** Points earned per base UAH spent (or per visit for visit-type) */
  pointsPerUah: number;
  /** Cashback percent of check amount */
  cashbackPercent: number;
  /** Minimum threshold for participation (minimum spend to earn points) */
  minimumThreshold: MinimumThreshold;
  /** Expiration limits */
  expiration: ExpirationConfig;
  /** Stacking priority (lower = higher priority) */
  stackingPriority: number;
  /** Max cashback % of check (cap) */
  maxCashbackPercent?: number;
  /** Whether program is active */
  active: boolean;
  /** Earning rules (each carries a JSON Logic expression) */
  earnRules: EarnRule[];
  /** Spending rules (each carries a JSON Logic expression) */
  spendRules: RedemptionRule[];
  /** Per-location overrides (optional) */
  locationOverrides?: Record<string, Partial<LoyaltyProgramConfig>>;
  /** Subscription pass configuration */
  subscription?: SubscriptionConfig;
}

// Subscription pass configuration (T-5008)
export interface SubscriptionConfig {
  /** Whether subscription is active */
  active: boolean;
  /** Subscription tier (BRONZE/SILVER/GOLD/PLATINUM) */
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  /** Monthly visit allowance */
  monthlyVisitAllowance: number;
  /** Rollover allowed (unused visits carry over) */
  allowRollover: boolean;
  /** Benefits per tier: cashback bonus, free add-ons, priority boost */
  benefits: {
    cashbackPercentBonus: number;
    freeAddons: string[];
    waitlistPriorityBoost: number;
    exclusiveServices: string[];
  };
  /** Billing configuration */
  billing: {
    priceUah: number;
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    autoRenew: boolean;
  };
  /** Whether priority booking is included */
  priorityBooking: boolean;
  /** Prorated refund window in days */
  refundWindowDays: number;
}

// Earn rule configuration (matching domain types)
export interface EarnRule {
  id: string;
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

// Export type for EarnRuleType
export type EarnRuleType = 'visit' | 'spend' | 'referral' | 'birthday' | 'review' | 'custom';

// Threshold DTOs live in a separate module to keep this file within max-lines.
export { SetThresholdInput, ThresholdOutput } from './loyalty-threshold.dto';
