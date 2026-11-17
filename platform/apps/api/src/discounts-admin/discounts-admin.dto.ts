// Discount Rule DTOs — T-153: Admin Discount Management.

/** Create Discount Rule input DTO */
export class CreateDiscountRuleInput {
  @IdempotencyKey()
  name: string;
  @IdempotencyKey()
  type: 'first_visit' | 'off_peak' | 'day_of_week' | 'category' | 'service' | 'client' | 'birthday';
  @IdempotencyKey()
  valueType: 'percent' | 'amount';
  @IdempotencyKey()
  value: number;
  @IdempotencyKey()
  applicableTo: 'all' | 'services' | 'categories' | 'clients' | 'specific';
  @IdempotencyKey()
  serviceIds?: string[];
  @IdempotencyKey()
  categoryIds?: string[];
  @IdempotencyKey()
  clientIds?: string[];
  @IdempotencyKey()
  validFrom: Date;
  @IdempotencyKey()
  validUntil?: Date;
  @IdempotencyKey()
  usageLimitTotal?: number;
  @IdempotencyKey()
  usageLimitPerClient?: number;
  @IdempotencyKey()
  description?: string;
}

/** Create Promo Code input DTO */
export class CreatePromoCodeInput {
  @IdempotencyKey()
  code: string;
  @IdempotencyKey()
  percent?: number;
  @IdempotencyKey()
  amountCents?: number;
  @IdempotencyKey()
  validFrom: Date;
  @IdempotencyKey()
  validUntil?: Date;
  @IdempotencyKey()
  usageLimitTotal?: number;
  @IdempotencyKey()
  usageLimitPerClient?: number;
  @IdempotencyKey()
  applicableTo: 'all' | 'new_clients' | 'vip' | 'specific_clients';
  @IdempotencyKey()
  clientIds?: string[];
  @IdempotencyKey()
  serviceIds?: string[];
  @IdempotencyKey()
  description?: string;
}

/** Discount Rule filters DTO */
export class DiscountRuleFilters {
  @IdempotencyKey()
  type?: 'first_visit' | 'off_peak' | 'day_of_week' | 'category' | 'service' | 'client' | 'birthday';
  @IdempotencyKey()
  status?: 'active' | 'inactive' | 'archived';
  @IdempotencyKey()
  applicableTo?: string;
  @IdempotencyKey()
  clientId?: string;
}

/** Promo Code filters DTO */
export class PromoCodeFilters {
  @IdempotencyKey()
  status?: 'active' | 'inactive' | 'expired';
  @IdempotencyKey()
  applicableTo?: string;
  @IdempotencyKey()
  clientId?: string;
}

/** Apply Discount Rule input DTO */
export class ApplyDiscountRuleInput {
  @IdempotencyKey()
  ruleId: string;
  @IdempotencyKey()
  appointmentId: string;
  @IdempotencyKey()
  agreedPrice: number;
  @IdempotencyKey()
  clientId: string;
}

/** Discount Audit Log DTO */
export class DiscountAuditLog {
  @IdempotencyKey()
  id: string;
  @IdempotencyKey()
  discountId: string;
  @IdempotencyKey()
  discountType: 'rule' | 'promo_code';
  @IdempotencyKey()
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  @IdempotencyKey()
  changedBy: string;
  @IdempotencyKey()
  changedAt: Date;
  @IdempotencyKey()
  details?: string;
}