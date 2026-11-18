// Резервація слота на час checkout (T-4802): токен із TTL, ретраї з backoff,
// аудит таймаутів і невдалих звільнень. Інваріант: один слот — один володар.
import { SLOT_LOCK_MAX_ATTEMPTS, SLOT_RESERVATION_TTL_MS, ReservationInvalidError, SlotLockedError, assertReservationHeld, backoffMs, newReservationToken, slotLockKey, type SlotLockTarget, type SlotReservation } from '../domain/slot-reservation';
import type { SlotLockAudit, SlotLockStore } from './slot-lock.ports';

export interface SlotReservationsConfig {
  ttlMs: number;
  maxAttempts: number;
}

export const DEFAULT_SLOT_RESERVATIONS_CONFIG: SlotReservationsConfig = {
  ttlMs: SLOT_RESERVATION_TTL_MS,
  maxAttempts: SLOT_LOCK_MAX_ATTEMPTS,
};

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface SlotReservationsOptions {
  config?: SlotReservationsConfig;
  sleep?: (ms: number) => Promise<void>;
}

export class SlotReservations {
  private readonly config: SlotReservationsConfig;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly store: SlotLockStore,
    private readonly audit: SlotLockAudit,
    options: SlotReservationsOptions = {}
  ) {
    this.config = options.config ?? DEFAULT_SLOT_RESERVATIONS_CONFIG;
    this.sleep = options.sleep ?? defaultSleep;
  }

  /** Бере лок під слот із ретраями; після вичерпання спроб — SlotLockedError. */
  async reserve(target: SlotLockTarget, now: Date = new Date()): Promise<SlotReservation> {
    const key = slotLockKey(target);
    let attempts = 0;
    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      attempts = attempt + 1;
      const reservation: SlotReservation = {
        key,
        token: newReservationToken(),
        expiresAt: new Date(now.getTime() + this.config.ttlMs),
      };
      if (await this.store.acquire(key, reservation.token, this.config.ttlMs)) return reservation;
      if (attempt + 1 < this.config.maxAttempts) await this.sleep(backoffMs(attempt));
    }
    this.audit.record({ type: 'timeout', key, attempts });
    throw new SlotLockedError(key);
  }

  /** Перевірка на бронюванні: токен ще наш і не прострочений. */
  async assertHeld(reservation: SlotReservation, now: Date = new Date()): Promise<void> {
    assertReservationHeld(reservation, await this.store.find(reservation.key), now);
  }

  /** Перевірка за парою ключ+токен, коли клієнт надіслав лише токен. */
  async assertHeldBy(key: string, token: string): Promise<void> {
    if ((await this.store.find(key)) !== token) {
      throw new ReservationInvalidError('Reservation is no longer held');
    }
  }

  /** Звільнення за ключем (дляDELETE-ендпоінта відмови від checkout). */
  async releaseByKey(key: string, token: string): Promise<boolean> {
    return this.store.release(key, token);
  }

  /** Звільнення після бронювання або відмови; збій лише аудитується. */
  async release(reservation: SlotReservation, attempts = 1): Promise<boolean> {
    const released = await this.store.release(reservation.key, reservation.token).catch((error) => {
      this.audit.record({
        type: 'release_failed',
        key: reservation.key,
        attempts,
        detail: error instanceof Error ? error.message : String(error),
      });
      return false;
    });
    if (!released) {
      this.audit.record({ type: 'release_failed', key: reservation.key, attempts });
    }
    return released;
  }
}
