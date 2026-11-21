import type {
  AccrualInput,
  AccrualResult,
  LoyaltyRule,
  MembershipUpgradeInput,
  MembershipUpgradeResult,
  RedemptionInput,
  RedemptionResult,
  VIPPerkEvaluationInput,
  VIPPerkEvaluationResult,
} from './types';
import type { LoyaltyAccount, LoyaltyTier } from './types';
import { accruePoints } from './accrual';
import { evaluateVipPerks } from './perks';
import { redeemGiftCard, redeemPoints } from './redemption';
import { calculateTier, DEFAULT_LOYALTY_RULE } from './rules';
import { upgradeMembership } from './upgrade';

export { DEFAULT_LOYALTY_RULE, TIER_UPGRADE_COSTS } from './rules';

export class LoyaltyEngine {
  private readonly rule: LoyaltyRule;

  constructor(rule: LoyaltyRule = DEFAULT_LOYALTY_RULE) {
    this.rule = rule;
  }

  public calculateTier(lifetimePoints: number): LoyaltyTier {
    return calculateTier(lifetimePoints, this.rule.tierThresholds);
  }

  public accruePoints(input: AccrualInput): AccrualResult {
    return accruePoints(input, this.rule);
  }

  public redeemPoints(input: RedemptionInput): RedemptionResult {
    return redeemPoints(input, this.rule);
  }

  public redeemGiftCard(
    account: LoyaltyAccount,
    giftCardAmountCents: number
  ): { newGiftCardBalanceCents: number } {
    return redeemGiftCard(account, giftCardAmountCents);
  }

  public evaluateVIPPerks(input: VIPPerkEvaluationInput): VIPPerkEvaluationResult {
    return evaluateVipPerks(input);
  }

  public upgradeMembership(input: MembershipUpgradeInput): MembershipUpgradeResult {
    return upgradeMembership(input, this.rule);
  }
}
