/* eslint-disable complexity -- 1 function with inherent domain branching (worst: optimizeSlotHoldPriority, complexity 12 vs 10); refactor tracked in T-2500f */
export interface SlotHoldPriorityContext {
  clientLoyaltyVisits: number;
  isVip: boolean;
  isPeakSlot: boolean;
  baseLeaseMinutes: number;
}

export interface SlotHoldPriorityResult {
  effectiveLeaseMinutes: number;
  maxExtensionsAllowed: number;
  priorityScore: number; // 0.0 to 1.0
  requiresDepositWaiver: boolean;
  reason: string;
}

export interface SlotHoldPriorityConfig {
  vipLeaseBonusMinutes: number; // e.g. 5
  peakLeaseReductionMinutes: number; // e.g. 2
  maxVipExtensions: number; // e.g. 3
  standardMaxExtensions: number; // e.g. 2
}

export const DEFAULT_SLOT_HOLD_PRIORITY_CONFIG: SlotHoldPriorityConfig = {
  vipLeaseBonusMinutes: 5,
  peakLeaseReductionMinutes: 2,
  maxVipExtensions: 3,
  standardMaxExtensions: 2,
};

/**
 * Optimizes slot hold durations, lease extensions, and client priority during high-demand booking windows.
 */
export function optimizeSlotHoldPriority(
  context: SlotHoldPriorityContext,
  config: SlotHoldPriorityConfig = DEFAULT_SLOT_HOLD_PRIORITY_CONFIG
): SlotHoldPriorityResult {
  const { clientLoyaltyVisits, isVip, isPeakSlot, baseLeaseMinutes } = context;

  let leaseAdjustment = 0;
  if (isVip || clientLoyaltyVisits >= 5) {
    leaseAdjustment += config.vipLeaseBonusMinutes;
  }
  if (isPeakSlot) {
    leaseAdjustment -= config.peakLeaseReductionMinutes;
  }

  const effectiveLeaseMinutes = Math.max(5, baseLeaseMinutes + leaseAdjustment);
  const maxExtensionsAllowed =
    isVip || clientLoyaltyVisits >= 5 ? config.maxVipExtensions : config.standardMaxExtensions;

  const priorityScore = Number(
    Math.min(
      1.0,
      Math.max(
        0,
        (isVip ? 0.4 : 0.0) +
          Math.min(0.4, (clientLoyaltyVisits / 10) * 0.4) +
          (isPeakSlot ? 0.2 : 0.0)
      )
    ).toFixed(4)
  );

  const requiresDepositWaiver = isVip && clientLoyaltyVisits >= 10;

  let reason = `Base lease ${baseLeaseMinutes}m adjusted to ${effectiveLeaseMinutes}m. `;
  if (isVip) {
    reason += 'VIP client status applied with extended lease and priority extensions. ';
  } else if (clientLoyaltyVisits >= 5) {
    reason += 'Loyal client tier applied with lease bonus. ';
  }
  if (isPeakSlot) {
    reason += 'Peak slot adjustment applied.';
  }

  return {
    effectiveLeaseMinutes,
    maxExtensionsAllowed,
    priorityScore,
    requiresDepositWaiver,
    reason,
  };
}
