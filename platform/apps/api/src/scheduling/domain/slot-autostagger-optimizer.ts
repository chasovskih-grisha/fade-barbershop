export interface SlotStaggerContext {
  requestedStartTimeIso: string;
  simultaneousBookingsInWindow: number;
  chairCapacity: number;
  serviceDurationMinutes: number;
  clientVipStatus?: boolean;
}

export interface SlotStaggerResult {
  originalStartTimeIso: string;
  staggeredStartTimeIso: string;
  offsetMinutes: number;
  assignedChairId: string;
  congestionMitigationApplied: boolean;
  reason: string;
}

export interface SlotStaggerConfig {
  maxSimultaneousPerChair: number; // e.g. 1
  staggerStepMinutes: number; // e.g. 5 or 10
  peakCongestionThreshold: number; // e.g. 3
}

export const DEFAULT_STAGGER_CONFIG: SlotStaggerConfig = {
  maxSimultaneousPerChair: 1,
  staggerStepMinutes: 5,
  peakCongestionThreshold: 3,
};

/**
 * Optimizes appointment start times by auto-staggering conflicting bookings across available chairs
 * to eliminate wait-room congestion and barber idle-overlap friction.
 */
export function optimizeSlotStaggering(
  context: SlotStaggerContext,
  config: SlotStaggerConfig = DEFAULT_STAGGER_CONFIG
): SlotStaggerResult {
  const { requestedStartTimeIso, simultaneousBookingsInWindow, chairCapacity, clientVipStatus } =
    context;

  const originalStartTimeIso = requestedStartTimeIso;
  const originalDate = new Date(requestedStartTimeIso);
  let offsetMinutes = 0;
  let congestionMitigationApplied = false;
  let assignedChairNumber = 1;

  if (simultaneousBookingsInWindow >= config.peakCongestionThreshold && !clientVipStatus) {
    // Stagger based on congestion index and chair capacity
    const overflowIndex = Math.floor(simultaneousBookingsInWindow / Math.max(1, chairCapacity));
    offsetMinutes = overflowIndex * config.staggerStepMinutes;
    congestionMitigationApplied = true;
    assignedChairNumber = (simultaneousBookingsInWindow % chairCapacity) + 1;
  } else if (clientVipStatus) {
    // VIP clients receive priority zero offset but get dedicated primary chair
    offsetMinutes = 0;
    congestionMitigationApplied = false;
    assignedChairNumber = 1;
  } else {
    assignedChairNumber = (simultaneousBookingsInWindow % chairCapacity) + 1;
  }

  const staggeredDate = new Date(originalDate.getTime() + offsetMinutes * 60 * 1000);
  const staggeredStartTimeIso = staggeredDate.toISOString();

  let reason = `Requested slot at ${requestedStartTimeIso}. `;
  if (congestionMitigationApplied) {
    reason += `Peak congestion detected (${simultaneousBookingsInWindow} concurrent). Applied +${offsetMinutes}m stagger offset to chair #${assignedChairNumber}.`;
  } else if (clientVipStatus) {
    reason += `VIP priority slot granted on chair #${assignedChairNumber} with zero stagger offset.`;
  } else {
    reason += `Standard routing assigned to chair #${assignedChairNumber} with zero stagger offset.`;
  }

  return {
    originalStartTimeIso,
    staggeredStartTimeIso,
    offsetMinutes,
    assignedChairId: `chair-${assignedChairNumber}`,
    congestionMitigationApplied,
    reason,
  };
}
