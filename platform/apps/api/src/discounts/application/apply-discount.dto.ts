// ApplyDiscount input DTO — T-152: Discount Mechanics.
export class ApplyDiscountInput {
  @IdempotencyKey()
  agreedPrice: number; // from service catalog at booking time
  @IdempotencyKey()
  clientId: string;
  @IdempotencyKey()
  promoCode?: string;
  @IdempotencyKey()
  rules?: string[];
  @IdempotencyKey()
  vipDiscountPercent?: number;
}

// Validate promo code input DTO
export class ValidatePromoCodeInput {
  @IdempotencyKey()
  code: string;
  @IdempotencyKey()
  clientId?: string;
}

// Get VIP discount input DTO
export class GetVipDiscountInput {
  @IdempotencyKey()
  clientId: string;
}