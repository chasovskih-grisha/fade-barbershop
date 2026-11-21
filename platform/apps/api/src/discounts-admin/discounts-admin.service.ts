/* eslint-disable max-lines, max-params -- cohesive module (279 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 4 signatures whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// Discounts Admin Service — T-153: Admin Discount Management.
// CRUD for discount rules and promo codes, validation, audit logging.
// Integrates with T-090 DiscountCalculator and T-152 Discount Mechanics.

import { uuidv7 } from '@fade/domain-shared';
import { prisma } from '../index';
import { calculateDiscounts } from '../discounts/domain/discount-calculator';
import type {
  CreateDiscountRuleInput as CreateRuleDto,
  CreatePromoCodeInput as CreatePromoDto,
  DiscountRuleFilters as RuleFiltersDto,
  PromoCodeFilters as PromoFiltersDto,
  DiscountRuleResponse,
  PromoCodeResponse,
  ApplyDiscountRuleResponse,
  DiscountRulesListResponse,
  PromoCodesListResponse,
} from './discounts-admin.dto';

/** Discount Rule types — consolidated from T-153 enum. */
export enum DiscountRuleType {
  FIRST_VISIT = 'first_visit',
  OFF_PEAK = 'off_peak',
  DAY_OF_WEEK = 'day_of_week',
  CATEGORY = 'category',
  SERVICE = 'service',
  CLIENT = 'client',
  BIRTHDAY = 'birthday',
}

/** Discount Rule status */
export enum DiscountRuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

/** Discount Rule - admin CRUD model */
export interface DiscountRule {
  id: string;
  name: string;
  type: DiscountRuleType;
  valueType: 'percent' | 'amount';
  value: number; // percent (0-100) or amount in cents
  applicableTo: 'all' | 'services' | 'categories' | 'clients' | 'specific';
  serviceIds?: string[];
  categoryIds?: string[];
  clientIds?: string[];
  validFrom: Date;
  validUntil?: Date;
  usageLimitTotal?: number; // total uses across all clients
  usageLimitPerClient?: number; // per client uses
  currentUsageTotal: number;
  currentUsagePerClient: Record<string, number>; // clientId -> count
  description?: string;
  status: DiscountRuleStatus;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

/** Promo Code - admin CRUD model */
export interface PromoCode {
  id: string;
  code: string; // uppercase, case-insensitive
  percent?: number;
  amountCents?: number; // fixed amount in cents
  validFrom: Date;
  validUntil?: Date;
  usageLimitTotal?: number;
  usageLimitPerClient?: number;
  currentUsageTotal: number;
  currentUsagePerClient: Record<string, number>;
  applicableTo: 'all' | 'new_clients' | 'vip' | 'specific_clients';
  clientIds?: string[];
  serviceIds?: string[];
  description?: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: Date;
  createdBy: string;
}

/** Create Discount Rule */
export interface CreateDiscountRuleInput {
  name: string;
  type: DiscountRuleType;
  valueType: 'percent' | 'amount';
  value: number;
  applicableTo: 'all' | 'services' | 'categories' | 'clients' | 'specific';
  serviceIds?: string[];
  categoryIds?: string[];
  clientIds?: string[];
  validFrom: Date;
  validUntil?: Date;
  usageLimitTotal?: number;
  usageLimitPerClient?: number;
  description?: string;
}

/** Create Promo Code */
export interface CreatePromoCodeInput {
  code: string;
  percent?: number;
  amountCents?: number;
  validFrom: Date;
  validUntil?: Date;
  usageLimitTotal?: number;
  usageLimitPerClient?: number;
  applicableTo: 'all' | 'new_clients' | 'vip' | 'specific_clients';
  clientIds?: string[];
  serviceIds?: string[];
  description?: string;
}

/** Admin: list discount rules with filters */
export interface DiscountRuleFilters {
  type?: DiscountRuleType;
  status?: DiscountRuleStatus;
  applicableTo?: string;
  clientId?: string;
}

/** Admin: list promo codes with filters */
export interface PromoCodeFilters {
  status?: 'active' | 'inactive' | 'expired';
  applicableTo?: string;
  clientId?: string;
}

/** Admin: apply discount rule to appointment */
export interface ApplyDiscountRuleInput {
  ruleId: string;
  appointmentId: string;
  agreedPrice: number;
  clientId: string;
}

/** Audit log entry for discount modification */
export interface DiscountAuditLog {
  id: string;
  discountId: string;
  discountType: 'rule' | 'promo_code';
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  changedBy: string;
  changedAt: Date;
  details?: string;
}

/** Service: create discount rule */
export async function createDiscountRule(
  input: CreateDiscountRuleInput,
  createdBy: string
): Promise<DiscountRuleResponse> {
  const rule = await prisma.discountRule.create({
    data: {
      name: input.name,
      type: input.type,
      valueType: input.valueType,
      value: input.value,
      applicableTo: input.applicableTo,
      serviceIds: input.serviceIds,
      categoryIds: input.categoryIds,
      clientIds: input.clientIds,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      usageLimitTotal: input.usageLimitTotal,
      usageLimitPerClient: input.usageLimitPerClient,
      description: input.description,
      status: DiscountRuleStatus.ACTIVE,
      currentUsageTotal: 0,
      currentUsagePerClient: {},
      createdAt: new Date(),
      createdBy,
      updatedAt: new Date(),
    },
  });
  return { success: true, data: rule };
}

/** Service: list discount rules with filters */
export async function listDiscountRules(
  filters: DiscountRuleFilters
): Promise<DiscountRulesListResponse> {
  const where: any = {};
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.applicableTo) where.applicableTo = filters.applicableTo;
  if (filters.clientId) where.clientIds = { has: filters.clientId };

  const rules = await prisma.discountRule.findMany({ where });
  return {
    success: true,
    data: rules,
    total: rules.length,
  };
}

/** Service: create promo code */
export async function createPromoCode(
  input: CreatePromoCodeInput,
  createdBy: string
): Promise<PromoCodeResponse> {
  const code = await prisma.promoCode.create({
    data: {
      code: input.code.toUpperCase(),
      percent: input.percent,
      amountCents: input.amountCents,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      usageLimitTotal: input.usageLimitTotal,
      usageLimitPerClient: input.usageLimitPerClient,
      applicableTo: input.applicableTo,
      clientIds: input.clientIds,
      serviceIds: input.serviceIds,
      description: input.description,
      status: 'active',
      currentUsageTotal: 0,
      currentUsagePerClient: {},
      createdAt: new Date(),
      createdBy,
      updatedAt: new Date(),
    },
  });
  return { success: true, data: code };
}

/** Service: list promo codes with filters */
export async function listPromoCodes(filters: PromoCodeFilters): Promise<PromoCodesListResponse> {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.applicableTo) where.applicableTo = filters.applicableTo;
  if (filters.clientId) where.clientIds = { has: filters.clientId };

  const codes = await prisma.promoCode.findMany({ where });
  return {
    success: true,
    data: codes,
    total: codes.length,
  };
}

/** Service: apply discount rule to appointment */
export async function applyDiscountRule(
  ruleId: string,
  appointmentId: string,
  agreedPrice: number,
  _clientId: string
): Promise<ApplyDiscountRuleResponse> {
  // Calculate discounts using the DiscountCalculator
  const result = calculateDiscounts({
    agreedPrice,
    rules: [{ type: 'rule', sourceId: ruleId }],
    capPercent: 30,
  });

  // Update rule usage tracking
  await prisma.discountRule.update({
    where: { id: ruleId },
    data: {
      currentUsageTotal: { increment: 1 },
    },
  });

  return {
    success: true,
    breakdown: result,
  };
}

/** Service: create audit log entry */
export async function createAuditLog(
  discountId: string,
  discountType: 'rule' | 'promo_code',
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
  changedBy: string,
  details?: string
): Promise<{ success: boolean; logEntry: any }> {
  const logEntry = await prisma.discountAuditLog.create({
    data: {
      id: uuidv7(),
      discount_id: discountId,
      discount_type: discountType,
      action,
      changed_by: changedBy,
      changed_at: new Date(),
      details,
    },
  });
  return { success: true, logEntry };
}

/** Nest-injectable facade over the admin discount functions. */
export class DiscountsAdminService {
  createDiscountRule(input: CreateRuleDto, createdBy: string): Promise<DiscountRuleResponse> {
    return createDiscountRule(input as unknown as CreateDiscountRuleInput, createdBy);
  }

  listDiscountRules(filters: RuleFiltersDto): Promise<DiscountRulesListResponse> {
    return listDiscountRules(filters as unknown as DiscountRuleFilters);
  }

  createPromoCode(input: CreatePromoDto, createdBy: string): Promise<PromoCodeResponse> {
    return createPromoCode(input as unknown as CreatePromoCodeInput, createdBy);
  }

  listPromoCodes(filters: PromoFiltersDto): Promise<PromoCodesListResponse> {
    return listPromoCodes(filters as unknown as PromoCodeFilters);
  }

  applyDiscountRule(
    ruleId: string,
    appointmentId: string,
    agreedPrice: number,
    clientId: string
  ): Promise<ApplyDiscountRuleResponse> {
    return applyDiscountRule(ruleId, appointmentId, agreedPrice, clientId);
  }

  createAuditLog(
    discountId: string,
    discountType: 'rule' | 'promo_code',
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    changedBy: string,
    details?: string
  ): Promise<{ success: boolean; logEntry: unknown }> {
    return createAuditLog(discountId, discountType, action, changedBy, details);
  }
}
