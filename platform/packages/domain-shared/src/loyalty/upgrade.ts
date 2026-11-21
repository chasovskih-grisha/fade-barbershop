import type {
  LoyaltyAccount,
  LoyaltyRule,
  MembershipUpgradeInput,
  MembershipUpgradeResult,
} from './types';
import { TIER_RANKS, TIER_UPGRADE_COSTS } from './rules';

export function upgradeMembership(
  input: MembershipUpgradeInput,
  rule: LoyaltyRule
): MembershipUpgradeResult {
  const { account, targetTier, paymentCents } = input;
  const requiredCostCents = TIER_UPGRADE_COSTS[targetTier];
  if (requiredCostCents === undefined) {
    throw new Error(`Invalid target tier: ${targetTier}`);
  }

  if (TIER_RANKS[targetTier] <= TIER_RANKS[account.tier]) {
    return {
      account,
      upgraded: false,
      message: `Account is already at tier ${account.tier}, which is equal or higher than target ${targetTier}.`,
    };
  }

  if (paymentCents < requiredCostCents) {
    throw new Error(
      `Insufficient payment for tier upgrade to ${targetTier}. Required: ${requiredCostCents} cents, Provided: ${paymentCents} cents`
    );
  }

  const threshold = rule.tierThresholds[targetTier];
  const updatedAccount: LoyaltyAccount = {
    ...account,
    tier: targetTier,
    lifetimePoints: Math.max(account.lifetimePoints, threshold),
  };

  return {
    account: updatedAccount,
    upgraded: true,
    message: `Successfully upgraded membership to ${targetTier}.`,
  };
}
