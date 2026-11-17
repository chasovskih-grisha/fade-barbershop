// Discounts Admin Service — T-153: Admin Discount Management.
// CRUD for discount rules and promo codes, validation, audit logging.
// Integrates with T-090 DiscountCalculator and T-152 Discount Mechanics.

import { prisma } from '../../..';
import { Appointment, Service, ClientProfile } from '../domain';
import { DiscountInput, calculateDiscounts, AppliedDiscount, PriceBreakdown } from '../discounts/domain/discount-calculator';
import { v4 as uuidv4 } from 'uuid';

/** Discount Rule types */
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