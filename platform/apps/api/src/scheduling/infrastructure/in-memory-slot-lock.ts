// Лок на один процес (T-4802): dev/test без Redis. У проді без REDIS_URL
// інваріант тримає serializable-транзакція Booking (T-040c), не цей адаптер.
import type { SlotLockStore } from '../application/slot-lock.ports';

interface Held {
  token: string;
  expiresAt: number;
}

export class InMemorySlotLock implements SlotLockStore {
  private readonly held = new Map<string, Held>();

  constructor(private readonly clock: () => number = () => Date.now()) {}

  async acquire(key: string, token: string, ttlMs: number): Promise<boolean> {
    const current = this.held.get(key);
    const now = this.clock();
    if (current && current.expiresAt > now) return false;
    this.held.set(key, { token, expiresAt: now + ttlMs });
    return true;
  }

  async release(key: string, token: string): Promise<boolean> {
    const current = this.held.get(key);
    if (!current || current.token !== token) return false;
    this.held.delete(key);
    return true;
  }

  async find(key: string): Promise<string | null> {
    const current = this.held.get(key);
    if (!current) return null;
    if (current.expiresAt <= this.clock()) {
      this.held.delete(key);
      return null;
    }
    return current.token;
  }
}
