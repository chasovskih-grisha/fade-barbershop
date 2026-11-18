export interface VipSmartAllocationContext {
  clientId: string;
  clientLoyaltyVisits: number;
  clientLifetimeSpentCents: number;
  isVip: boolean;
  serviceId: string;
  serviceBasePriceCents: number;
  barberId: string;
  barberUtilizationScore: number; // 0.0 to 1.0 (how busy the barber is today)
  requestedSlotTimestamp: string;
  isPeakHour: boolean;
}

export interface VipSmartAllocationResult {
  allocationScore: number; // 0.0 to 1.0 overall priority/allocation rating
  recommendedSurgeMultiplier: number; // e.g. 1.0 to 1.35
  reservedHoldWindowMinutes: number; // extended hold window for VIP/high-value bookings
  autoAssignedPriorityQueue: boolean; // whether client gets bumped to front of waitlist/queue if slot shifts
  dynamicBufferMinutes: number; // buffer needed before/after for barber transition & sanitation
  rationale: string;
}

export interface VipSmartAllocationConfig {
  baseSurgeMultiplier: number;
  vipLeaseExtensionMinutes: number;
  maxSurgeMultiplier: number;
}

export const DEFAULT_VIP_SMART_ALLOCATION_CONFIG: VipSmartAllocationConfig = {
  baseSurgeMultiplier: 1.0,
  vipLeaseExtensionMinutes: 7,
  maxSurgeMultiplier: 1.40,
};

/**
 * Optimizes scheduling slot allocation by factoring in VIP status, lifetime client spend,
 * barber chair utilization, and peak-hour dynamic surge yield. Ensures elite FADE clients
 * receive priority slot locks while maximizing shop revenue per chair hour.
 */
export function optimizeVipSmartAllocation(
  context: VipSmartAllocationContext,
  config: VipSmartAllocationConfig = DEFAULT_VIP_SMART_ALLOCATION_CONFIG
): VipSmartAllocationResult {
  const {
    clientLoyaltyVisits,
    clientLifetimeSpentCents,
    isVip,
    barberUtilizationScore,
    isPeakHour,
  } = context;

  // 1. Calculate Allocation Priority Score (0.0 - 1.0)
  let vipWeight = isVip ? 0.35 : 0.0;
  let loyaltyWeight = Math.min(0.30, (clientLoyaltyVisits / 20) * 0.30);
  let spendWeight = Math.min(0.20, (clientLifetimeSpentCents / 500000) * 0.20); // maxed at $5,000 lifetime
  let utilizationWeight = barberUtilizationScore * 0.15;

  const allocationScore = Number(
    Math.min(1.0, Math.max(0.0, vipWeight + loyaltyWeight + spendWeight + utilizationWeight)).toFixed(4)
  );

  // 2. Calculate Recommended Surge Yield Multiplier
  let surgeMultiplier = config.baseSurgeMultiplier;
  if (isPeakHour) {
    surgeMultiplier += 0.15;
  }
  if (barberUtilizationScore > 0.85) {
    surgeMultiplier += 0.10;
  }
  // VIP discount / loyalty benefit: do not overly surge loyal/VIP clients during peak hours
  if (isVip || clientLoyaltyVisits >= 10) {
    surgeMultiplier = Math.max(1.0, surgeMultiplier - 0.05);
  }
  const recommendedSurgeMultiplier = Number(
    Math.min(config.maxSurgeMultiplier, Math.max(1.0, surgeMultiplier)).toFixed(2)
  );

  // 3. Reserved Hold Window & Buffer Minutes
  let reservedHoldWindowMinutes = 10; // default hold
  if (isVip || clientLoyaltyVisits >= 8) {
    reservedHoldWindowMinutes += config.vipLeaseExtensionMinutes;
  }

  let dynamicBufferMinutes = 5;
  if (barberUtilizationScore > 0.90) {
    dynamicBufferMinutes = 10; // ensure sanitation buffer when barber is heavily utilized
  }

  const autoAssignedPriorityQueue = isVip || clientLoyaltyVisits >= 12 || clientLifetimeSpentCents >= 300000;

  const rationale = `VIP Smart Allocation calculated score ${allocationScore}. ` +
    `Surge multiplier set to ${recommendedSurgeMultiplier}x (Peak: ${isPeakHour}, Util: ${barberUtilizationScore}). ` +
    `Reserved hold window: ${reservedHoldWindowMinutes}m. Buffer: ${dynamicBufferMinutes}m. Priority queue: ${autoAssignedPriorityQueue}.`;

  return {
    allocationScore,
    recommendedSurgeMultiplier,
    reservedHoldWindowMinutes,
    autoAssignedPriorityQueue,
    dynamicBufferMinutes,
    rationale,
  };
}
