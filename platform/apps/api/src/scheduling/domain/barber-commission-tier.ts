export interface CommissionCalculationInput {
  barberId: string;
  baseServiceRevenue: number;
  productSalesRevenue?: number;
  tipsAmount?: number;
  occupancyRate: number;
  customBaseCommissionRate?: number; // default 0.40 (40%)
}

export interface CommissionCalculationResult {
  barberId: string;
  occupancyRate: number;
  commissionTier: 'standard' | 'bronze' | 'silver' | 'gold';
  baseCommissionRate: number;
  appliedCommissionRate: number;
  serviceCommissionAmount: number;
  productCommissionAmount: number;
  tipsAmount: number;
  bonusMultiplier: number;
  bonusPayoutAmount: number;
  totalPayoutAmount: number;
}

/**
 * Calculates tiered commission, product sales share, tips, and occupancy-based bonuses for FADE barbers.
 */
export function calculateBarberCommissionAndPayout(
  input: CommissionCalculationInput
): CommissionCalculationResult {
  const baseRate = input.customBaseCommissionRate ?? 0.4;
  const productRevenue = input.productSalesRevenue ?? 0;
  const tips = input.tipsAmount ?? 0;
  const occupancy = Math.max(0, Math.min(1.0, input.occupancyRate));

  let commissionTier: 'standard' | 'bronze' | 'silver' | 'gold' = 'standard';
  let tierRateBonus = 0.0;
  let bonusMultiplier = 1.0;

  if (occupancy >= 0.85) {
    commissionTier = 'gold';
    tierRateBonus = 0.1; // +10% absolute commission rate boost (e.g. 40% -> 50%)
    bonusMultiplier = 1.2;
  } else if (occupancy >= 0.7) {
    commissionTier = 'silver';
    tierRateBonus = 0.05; // +5% (40% -> 45%)
    bonusMultiplier = 1.1;
  } else if (occupancy >= 0.5) {
    commissionTier = 'bronze';
    tierRateBonus = 0.025; // +2.5% (40% -> 42.5%)
    bonusMultiplier = 1.05;
  }

  const appliedCommissionRate = Number((baseRate + tierRateBonus).toFixed(4));
  const serviceCommissionAmount = Number(
    (input.baseServiceRevenue * appliedCommissionRate).toFixed(2)
  );

  // Product sales commission fixed at 15%
  const productCommissionRate = 0.15;
  const productCommissionAmount = Number((productRevenue * productCommissionRate).toFixed(2));

  // Base service commission + product commission subtotal before bonus multiplier
  const subtotal = serviceCommissionAmount + productCommissionAmount;
  const bonusPayoutAmount = Number((subtotal * (bonusMultiplier - 1.0)).toFixed(2));

  const totalPayoutAmount = Number((subtotal + bonusPayoutAmount + tips).toFixed(2));

  return {
    barberId: input.barberId,
    occupancyRate: occupancy,
    commissionTier,
    baseCommissionRate: baseRate,
    appliedCommissionRate,
    serviceCommissionAmount,
    productCommissionAmount,
    tipsAmount: tips,
    bonusMultiplier,
    bonusPayoutAmount,
    totalPayoutAmount,
  };
}
