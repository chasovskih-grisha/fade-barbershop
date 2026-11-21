import type { LoyaltyAccount, LoyaltyRule, RedemptionInput, RedemptionResult } from './types';

export function redeemPoints(input: RedemptionInput, rule: LoyaltyRule): RedemptionResult {
  const { account, pointsToRedeem, purchaseAmountCents } = input;
  if (pointsToRedeem <= 0) {
    return {
      discountCents: 0,
      remainingPoints: account.points,
      remainingGiftCardBalanceCents: account.giftCardBalanceCents,
    };
  }

  if (pointsToRedeem > account.points) {
    throw new Error(
      `Insufficient loyalty points. Requested: ${pointsToRedeem}, Available: ${account.points}`
    );
  }

  const maxDiscountFromPointsCents = pointsToRedeem * rule.redemptionRateCentsPerPoint;
  const discountCents = Math.min(maxDiscountFromPointsCents, purchaseAmountCents);
  const pointsConsumed = Math.ceil(discountCents / rule.redemptionRateCentsPerPoint);

  return {
    discountCents,
    remainingPoints: account.points - pointsConsumed,
    remainingGiftCardBalanceCents: account.giftCardBalanceCents,
  };
}

export function redeemGiftCard(
  account: LoyaltyAccount,
  giftCardAmountCents: number
): { newGiftCardBalanceCents: number } {
  if (giftCardAmountCents <= 0) {
    throw new Error('Gift card redemption amount must be positive');
  }
  if (giftCardAmountCents > account.giftCardBalanceCents) {
    throw new Error(
      `Insufficient gift card balance. Requested: ${giftCardAmountCents}, Available: ${account.giftCardBalanceCents}`
    );
  }

  return {
    newGiftCardBalanceCents: account.giftCardBalanceCents - giftCardAmountCents,
  };
}
