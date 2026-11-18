export interface SlotHoldRequest {
  slotId: string;
  clientId: string;
  requestedAt: Date;
  ttlSeconds: number;
}

export interface SlotDeadlockPreventionResult {
  isAllowed: boolean;
  activeHoldCount: number;
  backoffSeconds: number;
  reason: string;
}

export interface SlotDeadlockConfig {
  maxConcurrentHoldsPerClient: number; // e.g. 3
  deadlockBackoffBaseSeconds: number; // e.g. 5
  suspiciousVelocityThreshold: number; // max holds per minute
}

export const DEFAULT_SLOT_DEADLOCK_CONFIG: SlotDeadlockConfig = {
  maxConcurrentHoldsPerClient: 3,
  deadlockBackoffBaseSeconds: 5,
  suspiciousVelocityThreshold: 5,
};

/**
 * Prevents slot locking deadlocks, race conditions, and denial-of-service via excessive concurrent holds.
 */
export function evaluateSlotDeadlockPrevention(
  currentHolds: SlotHoldRequest[],
  incomingRequest: SlotHoldRequest,
  config: SlotDeadlockConfig = DEFAULT_SLOT_DEADLOCK_CONFIG
): SlotDeadlockPreventionResult {
  const clientHolds = currentHolds.filter((h) => h.clientId === incomingRequest.clientId);

  // Check velocity (holds in last 60 seconds) first
  const oneMinuteAgo = new Date(incomingRequest.requestedAt.getTime() - 60000);
  const recentHolds = clientHolds.filter((h) => h.requestedAt >= oneMinuteAgo);

  if (recentHolds.length >= config.suspiciousVelocityThreshold) {
    return {
      isAllowed: false,
      activeHoldCount: clientHolds.length,
      backoffSeconds: config.deadlockBackoffBaseSeconds * 4,
      reason: `Suspicious slot hold velocity detected (${recentHolds.length} holds in past minute). Rate limited.`,
    };
  }

  if (clientHolds.length >= config.maxConcurrentHoldsPerClient) {
    return {
      isAllowed: false,
      activeHoldCount: clientHolds.length,
      backoffSeconds: config.deadlockBackoffBaseSeconds * (clientHolds.length + 1),
      reason: `Client has reached maximum concurrent slot holds (${clientHolds.length}/${config.maxConcurrentHoldsPerClient}). Backoff required.`,
    };
  }

  return {
    isAllowed: true,
    activeHoldCount: clientHolds.length,
    backoffSeconds: 0,
    reason: 'Slot hold request permitted under deadlock prevention bounds.',
  };
}
