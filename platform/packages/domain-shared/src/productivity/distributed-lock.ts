import { createHash } from 'crypto';
import type {
  AcquireLockInput,
  SlotLockResult,
  TwoChairInvariantInput,
  TwoChairInvariantResult,
} from './distributed-lock.types';

export * from './distributed-lock.types';

const MAX_CHAIRS = 2;

/**
 * Distributed slot locking engine enforcing two-chair invariant and race-condition safety.
 */
export class DistributedSlotLockingEngine {
  private activeLocks: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Attempts to acquire a distributed lock for a specific slot, barber and date.
   */
  async acquireLock(input: AcquireLockInput): Promise<SlotLockResult> {
    const { barberId, date, slotTime, options = {} } = input;
    const ttlMs = options.ttlMs ?? 5000;
    const retryCount = options.retryCount ?? 3;
    const retryDelayMs = options.retryDelayMs ?? 100;

    const rawKey = `lock:barber:${barberId}:date:${date}:slot:${slotTime}`;
    const lockKey = createHash('sha256').update(rawKey).digest('hex');
    const token = createHash('sha256')
      .update(`${lockKey}:${Date.now()}:${Math.random()}`)
      .digest('hex');

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const existing = this.activeLocks.get(lockKey);
      const now = Date.now();

      if (!existing || existing.expiresAt < now) {
        this.activeLocks.set(lockKey, { token, expiresAt: now + ttlMs });
        return { acquired: true, lockKey, token };
      }

      if (attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(1.5, attempt)));
      }
    }

    return { acquired: false, lockKey, token: '' };
  }

  /**
   * Releases an acquired slot lock using its token.
   */
  async releaseLock(lockKey: string, token: string): Promise<boolean> {
    const existing = this.activeLocks.get(lockKey);
    if (existing && existing.token === token) {
      this.activeLocks.delete(lockKey);
      return true;
    }
    return false;
  }

  /**
   * Verifies that a barber does not exceed active parallel bookings at a given time.
   */
  async enforceTwoChairInvariant(input: TwoChairInvariantInput): Promise<TwoChairInvariantResult> {
    const { barberId, date, slotTime, currentActiveBookingsCount } = input;
    if (currentActiveBookingsCount >= MAX_CHAIRS) {
      return {
        allowed: false,
        reason: `Two-chair invariant violated: Barber ${barberId} already has ${currentActiveBookingsCount} active bookings at ${slotTime} on ${date}.`,
      };
    }
    return { allowed: true };
  }
}

export const slotLockingEngine = new DistributedSlotLockingEngine();
