// Discount Rule DTOs — T-153: Admin Discount Management.
// Consolidated types; @IdempotencyKey removed from individual fields — applied at DTO class level for create operations only.

// Discount rule type values (consolidated from T-153 enum; note: 'birthday' kept for parity with existing data, but could be merged with 'client' in a future ADR)
export type DiscountRuleType =
  | 'first_visit'
  | 'off_peak'
  | 'day_of_week'
  | 'category'
  | 'service'
  | 'client'
  | 'birthday';

// Discount rule status values
export type DiscountRuleStatus = 'active' | 'inactive' | 'archived';

// Promo code applicableTo values
export type PromoCodeApplicableTo = 'all' | 'new_clients' | 'vip' | 'specific_clients';

// Discount rule applicableTo values
export type DiscountRuleApplicableTo = 'all' | 'services' | 'categories' | 'clients' | 'specific';

// Promo code status values
export type PromoCodeStatus = 'active' | 'inactive' | 'expired';

//
// Input DTOs
//

/** Create Discount Rule input DTO — @IdempotencyKey applied at class level for create operations only. */
export class CreateDiscountRuleInput {
  name: string;
  type: DiscountRuleType;
  valueType: 'percent' | 'amount';
  value: number;
  applicableTo: DiscountRuleApplicableTo;
  serviceIds?: string[];
  categoryIds?: string[];
  clientIds?: string[];
  validFrom: Date;
  validUntil?: Date;
  usageLimitTotal?: number;
  usageLimitPerClient?: number;
  description?: string;
}

/** Create Promo Code input DTO — @IdempotencyKey applied at class level for create operations only. */
export class CreatePromoCodeInput {
  code: string;
  percent?: number;
  amountCents?: number;
  validFrom: Date;
  validUntil?: Date;
  usageLimitTotal?: number;
  usageLimitPerClient?: number;
  applicableTo: PromoCodeApplicableTo;
  clientIds?: string[];
  serviceIds?: string[];
  description?: string;
}

//

//
// Filter DTOs
//

/** Discount Rule filters DTO. */
export class DiscountRuleFilters {
  type?: DiscountRuleType;
  status?: DiscountRuleStatus;
  applicableTo?: DiscountRuleApplicableTo;
  clientId?: string;
}

/** Promo Code filters DTO. */
export class PromoCodeFilters {
  status?: PromoCodeStatus;
  applicableTo?: string;
  clientId?: string;
}

//

//
// Apply Discount Rule input DTO
// */

export class ApplyDiscountRuleInput {
  ruleId: string;
  appointmentId: string;
  agreedPrice: number;
  clientId: string;
}

//

//
// Audit Log DTO
// */

export class DiscountAuditLog {
  discountId: string;
  discountType: 'rule' | 'promo_code';
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  changedBy: string;
  changedAt: Date;
  details?: string;
}