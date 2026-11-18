export interface SlotLeaseRequest {
  leaseId: string;
  slotId: string;
  barberId: string;
  clientId: string;
  version: number;
  acquiredAtTimestamp: number;
  expiresAtTimestamp: number;
  currentTimestamp: number;
  heartbeatCount: number;
  contentionScore: number;
}

export interface SlotLeaseResult {
  leaseId: string;
  slotId: string;
  status: 'ACTIVE' | 'RENEWED' | 'EXPIRED' | 'EVICTED_HIGH_CONTENTION';
  newExpiresAtTimestamp: number;
  newVersion: number;
  actionRequired: 'PROCEED_CHECKOUT' | 'REQUEST_HEARTBEAT' | 'RELEASE_AND_RETRY' | 'FORCE_EVICT';
  reason: string;
}

export interface SlotLeaseConfig {
  defaultLeaseTtlMs: number; // e.g. 180,000 (3 mins)
  maxHeartbeats: number; // e.g. 5
  contentionEvictionThreshold: number; // e.g. 8
}

export const DEFAULT_SLOT_LEASE_CONFIG: SlotLeaseConfig = {
  defaultLeaseTtlMs: 180000,
  maxHeartbeats: 5,
  contentionEvictionThreshold: 8,
};

/**
 * Optimizes concurrent slot lease allocation, optimistic locking versioning, and contention eviction.
 */
export function optimizeSlotLeaseConcurrency(
  requests: SlotLeaseRequest[],
  config: SlotLeaseConfig = DEFAULT_SLOT_LEASE_CONFIG
): SlotLeaseResult[] {
  return requests.map((req) => {
    const ttlRemaining = req.expiresAtTimestamp - req.currentTimestamp;
    let status: SlotLeaseResult['status'] = 'ACTIVE';
    let actionRequired: SlotLeaseResult['actionRequired'] = 'PROCEED_CHECKOUT';
    let newExpiresAtTimestamp = req.expiresAtTimestamp;
    let newVersion = req.version;
    let reason = 'Slot lease is active and valid.';

    if (ttlRemaining <= 0) {
      status = 'EXPIRED';
      actionRequired = 'RELEASE_AND_RETRY';
      reason = 'Slot lease has expired; renewal required.';
    } else if (req.contentionScore >= config.contentionEvictionThreshold) {
      status = 'EVICTED_HIGH_CONTENTION';
      actionRequired = 'FORCE_EVICT';
      reason = `Slot lease evicted due to critical contention score (${req.contentionScore}).`;
    } else if (ttlRemaining < 45000 && req.heartbeatCount < config.maxHeartbeats) {
      status = 'RENEWED';
      newExpiresAtTimestamp = req.currentTimestamp + config.defaultLeaseTtlMs;
      newVersion += 1;
      actionRequired = 'REQUEST_HEARTBEAT';
      reason = 'Slot lease expiring soon; successfully renewed via heartbeat.';
    }

    return {
      leaseId: req.leaseId,
      slotId: req.slotId,
      status,
      newExpiresAtTimestamp,
      newVersion,
      actionRequired,
      reason,
    };
  });
}
