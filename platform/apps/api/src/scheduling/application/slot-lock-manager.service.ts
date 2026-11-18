
export interface SlotLockConfig {
  defaultLeaseMinutes: number;
  maxExtensionMinutes: number;
}

export const DEFAULT_SLOT_LOCK_CONFIG: SlotLockConfig = {
  defaultLeaseMinutes: 10,
  maxExtensionMinutes: 20,
};

export interface SlotLockRequest {
  slotId: string;
  barberId: string;
  locationId: string;
  clientSessionId: string;
  slotStart: Date;
  slotEnd: Date;
  timeZone?: string;
}

export interface SlotLockRecord {
  lockId: string;
  slotId: string;
  barberId: string;
  clientSessionId: string;
  expiresAt: Date;
  extendedCount: number;
  timeZone: string;
}

export class SlotLockConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlotLockConflictError';
  }
}

export class SlotLockManagerService {
  private activeLocks: Map<string, SlotLockRecord> = new Map();

  constructor(private config: SlotLockConfig = DEFAULT_SLOT_LOCK_CONFIG) {}

  acquireLock(request: SlotLockRequest, now: Date = new Date()): SlotLockRecord {
    if (request.slotEnd.getTime() <= request.slotStart.getTime()) {
      throw new RangeError('Slot end time must be strictly after slot start time');
    }
    const timeZone = request.timeZone ?? 'Europe/Kyiv';
    const key = `${request.barberId}:${request.slotStart.toISOString()}`;

    const existing = this.activeLocks.get(key);
    if (existing && existing.expiresAt > now) {
      if (existing.clientSessionId !== request.clientSessionId) {
        throw new SlotLockConflictError(`Slot is currently locked by another client session`);
      }
      return existing;
    }

    const expiresAt = new Date(now.getTime() + this.config.defaultLeaseMinutes * 60 * 1000);
    const lockRecord: SlotLockRecord = {
      lockId: `lock_${Math.random().toString(36).substring(2, 9)}`,
      slotId: request.slotId,
      barberId: request.barberId,
      clientSessionId: request.clientSessionId,
      expiresAt,
      extendedCount: 0,
      timeZone,
    };

    this.activeLocks.set(key, lockRecord);
    return lockRecord;
  }

  extendLock(lockId: string, clientSessionId: string, now: Date = new Date()): SlotLockRecord {
    let foundRecord: SlotLockRecord | undefined;
    let foundKey: string | undefined;

    for (const [key, record] of this.activeLocks.entries()) {
      if (record.lockId === lockId) {
        foundRecord = record;
        foundKey = key;
        break;
      }
    }

    if (!foundRecord || !foundKey) {
      throw new Error(`Lock not found or already expired`);
    }

    if (foundRecord.clientSessionId !== clientSessionId) {
      throw new SlotLockConflictError(`Unauthorized lock extension attempt`);
    }

    if (foundRecord.expiresAt <= now) {
      this.activeLocks.delete(foundKey);
      throw new Error(`Lock has expired and cannot be extended`);
    }

    if (foundRecord.extendedCount >= 2) {
      throw new Error(`Maximum lock extensions reached`);
    }

    const newExpiresAt = new Date(foundRecord.expiresAt.getTime() + 5 * 60 * 1000);
    const updated: SlotLockRecord = {
      ...foundRecord,
      expiresAt: newExpiresAt,
      extendedCount: foundRecord.extendedCount + 1,
    };

    this.activeLocks.set(foundKey, updated);
    return updated;
  }

  releaseLock(lockId: string, clientSessionId: string): boolean {
    for (const [key, record] of this.activeLocks.entries()) {
      if (record.lockId === lockId) {
        if (record.clientSessionId !== clientSessionId) {
          throw new SlotLockConflictError(`Unauthorized lock release attempt`);
        }
        return this.activeLocks.delete(key);
      }
    }
    return false;
  }

  purgeExpiredLocks(now: Date = new Date()): number {
    let count = 0;
    for (const [key, record] of this.activeLocks.entries()) {
      if (record.expiresAt <= now) {
        this.activeLocks.delete(key);
        count++;
      }
    }
    return count;
  }
}
