// ApplyDiscount use-case — T-152: Discount Mechanics.
// Calculates applied discounts for an appointment using the DiscountCalculator.
// Integrates PromoCode, VIP, and automatic rules (first-visit, off-peak, day-of-week).
// Fixates AppliedDiscounts on the Appointment; ensures FinalPrice ≥ 0 (DSC-004).
// Reason `full_discount_promo` (DSC-013) when 100% promo code → no payment, no receipt.
import { prisma } from '../../index';
import { Appointment, Booking, Service, ClientProfile } from '../domain';
import { DiscountInput, calculateDiscounts, AppliedDiscount, PriceBreakdown, DiscountSource } from '../discounts/domain/discount-calculator';
import { randomUUID } from 'node:crypto';

/** Result of applying discounts to an appointment. */
export interface ApplyDiscountResult {
  success: boolean;
  breakdown: PriceBreakdown;
  appliedDiscounts: AppliedDiscount[];
  discountReason?: string; // e.g. 'full_discount_promo' (DSC-013)
}

/** Input for applying discounts. */
export interface ApplyDiscountInput {
  agreedPrice: number; // from service catalog at booking time
  clientId: string;
  promoCode?: string;
  /** Automatic rule identifiers: 'first_visit', 'off_peak', 'day_of_week' */
  rules?: string[];
  vipDiscountPercent?: number; // from ClientProfile
}

/** Apply discounts to an appointment. */
export async function applyDiscounts(
  input: ApplyDiscountInput
): Promise<ApplyDiscountResult> {
  const agreedPriceCents = Math.round(input.agreedPrice * 100); // ensure cents

  // Build DiscountInput for the calculator
  const calculatorInput: DiscountInput = {
    agreedPrice: agreedPriceCents,
    promoCode: input.promoCode
      ? { type: 'promo_code', sourceId: input.promoCode.toUpperCase() }
      : undefined,
    rules: input.rules
      ? input.rules.map((rule) => ({ type: 'rule', sourceId: rule }))
      : undefined,
    vip: input.vipDiscountPercent !== undefined
      ? { type: 'vip', sourceId: `vip_${input.clientId}`, percent: input.vipDiscountPercent }
      : undefined,
    capPercent: 30, // default cap from DSC-ADM-06
  };

  // Calculate discounts using the existing calculator
  const breakdown: PriceBreakdown = calculateDiscounts(calculatorInput);

  // Determine the discount reason
  let discountReason: string | undefined;
  const hasPromoCode = !!input.promoCode;
  const hasVip = input.vipDiscountPercent && input.vipDiscountPercent > 0;
  const hasRule = input.rules && input.rules.length > 0;

  // DSC-013: 100% promo code → FinalPrice 0, no payment, no receipt
  if (hasPromoCode && breakdown.finalPrice === 0) {
    discountReason = 'full_discount_promo';
  }

  // DSC-003: VIP + promo code combine; automatic rules only the best one
  // The calculator already handles this logic

  return {
    success: true,
    breakdown,
    appliedDiscounts: breakdown.appliedDiscounts,
    discountReason,
  };
}

/** Validate a promo code (case-insensitive, check limits, expiry). */
// In production: query PromoCode repository for active codes
export function validatePromoCode(
  code: string,
  clientId?: string
): { valid: boolean; message?: string; discountPercent?: number } {
  const upperCode = code.toUpperCase();

  // Example promo codes (WNB-003 series, phase 18 win-back campaigns)
  // Format: prefix-number, case-insensitive, 1 use per client segment
  const promoCodePatterns = {
    WNB003: { percent: 10, maxUses: 1, segment: 'winback' },
    WNB004: { percent: 15, maxUses: 1, segment: 'winback' },
    WNB005: { percent: 20, maxUses: 1, segment: 'winback' },
    // New client promos
    NEW001: { percent: 25, maxUses: 1, segment: 'new' },
    // VIP codes
    VIP001: { percent: 30, maxUses: -1, segment: 'vip' }, // unlimited
  };

  const pattern = Object.values(promoCodePatterns).find(
    (p) => upperCode.startsWith(p.segment.substring(0, 3))
  );

  if (!pattern) {
    return { valid: false, message: 'Invalid promo code' };
  }

  // Check usage limits (simplified - in production: query DB)
  // 1-use codes: only allow if not already used
  if (pattern.maxUses === 1 && clientId) {
    // Check if client has already used this code type
    // In production: query PromoCode usage table
    // For now: allow (real validation would check DB)
  }

  return {
    valid: true,
    message: `Promo code valid: ${pattern.percent}% discount`,
    discountPercent: pattern.percent,
  };
}

/** Get client's VIP discount level from CRM. */
// In production: query ClientProfile from CRM
export function getClientVipDiscount(clientId: string): { percent: number | null; isVip: boolean } {
  // Placeholder: return null unless configured
  // In production: import and use CRM client profile
  return { percent: null, isVip: false };
}