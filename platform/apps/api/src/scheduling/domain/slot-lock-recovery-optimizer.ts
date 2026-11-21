/* eslint-disable complexity -- 1 function with inherent domain branching (worst: an existing definition, complexity 11 vs 10); refactor tracked in T-2500f */
export interface SlotLockRecord {
  lockId: string;
  slotId: string;
  barberId: string;
  clientId: string;
  lockedAtTimestamp: number;
  expiresAtTimestamp: number;
  currentTimestamp: number;
  isCheckoutActive: boolean;
  contentionCount: number;
}

export interface SlotLockRecoveryResult {
  lockId: string;
  slotId: string;
  status: 'ACTIVE' | 'EXPIRED_RECOVERED' | 'GRACE_EXTENDED' | 'DEADLOCK_RESOLVED';
  remainingTtlMs: number;
  graceExtensionAppliedMs: number;
  contentionSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionRecommended: 'RELEASE_SLOT' | 'EXTEND_LEASE' | 'FORCE_UNLOCK' | 'HOLD';
}

export interface SlotLockRecoveryConfig {
  defaultTtlMs: number; // e.g. 300,000 ms (5 mins)
  graceExtensionMs: number; // e.g. 120,000 ms (2 mins) for active checkout
  contentionThresholdHigh: number; // e.g. 3 concurrent attempts
  contentionThresholdCritical: number; // e.g. 5 concurrent attempts
}

export const DEFAULT_SLOT_LOCK_RECOVERY_CONFIG: SlotLockRecoveryConfig = {
  defaultTtlMs: 300000,
  graceExtensionMs: 120000,
  contentionThresholdHigh: 3,
  contentionThresholdCritical: 5,
};

/**
 * Optimizes slot locking recovery, lock expiration management, and concurrency conflict resolution.
 */
export function optimizeSlotLockRecovery(
  records: SlotLockRecord[],
  config: SlotLockRecoveryConfig = DEFAULT_SLOT_LOCK_RECOVERY_CONFIG
): SlotLockRecoveryResult[] {
  return records.map((record) => {
    const elapsedMs = record.currentTimestamp - record.lockedAtTimestamp;
    const remainingTtlMs = record.expiresAtTimestamp - record.currentTimestamp;

    let status: SlotLockRecoveryResult['status'] = 'ACTIVE';
    let graceExtensionAppliedMs = 0;
    let actionRecommended: SlotLockRecoveryResult['actionRecommended'] = 'HOLD';

    // Contention severity analysis
    let contentionSeverity: SlotLockRecoveryResult['contentionSeverity'] = 'LOW';
    if (record.contentionCount >= config.contentionThresholdCritical) {
      contentionSeverity = 'CRITICAL';
    } else if (record.contentionCount >= config.contentionThresholdHigh) {
      contentionSeverity = 'HIGH';
    } else if (record.contentionCount > 1) {
      contentionSeverity = 'MEDIUM';
    }

    if (remainingTtlMs <= 0) {
      if (record.isCheckoutActive && elapsedMs < config.defaultTtlMs + config.graceExtensionMs) {
        status = 'GRACE_EXTENDED';
        graceExtensionAppliedMs = config.graceExtensionMs;
        actionRecommended = 'EXTEND_LEASE';
      } else {
        status = 'EXPIRED_RECOVERED';
        actionRecommended = 'RELEASE_SLOT';
      }
    } else if (contentionSeverity === 'CRITICAL' && !record.isCheckoutActive) {
      status = 'DEADLOCK_RESOLVED';
      actionRecommended = 'FORCE_UNLOCK';
    } else if (record.isCheckoutActive && remainingTtlMs < 60000) {
      status = 'GRACE_EXTENDED';
      graceExtensionAppliedMs = config.graceExtensionMs;
      actionRecommended = 'EXTEND_LEASE';
    }

    return {
      lockId: record.lockId,
      slotId: record.slotId,
      status,
      remainingTtlMs: Math.max(0, remainingTtlMs + graceExtensionAppliedMs),
      graceExtensionAppliedMs,
      contentionSeverity,
      actionRecommended,
    };
  });
}
