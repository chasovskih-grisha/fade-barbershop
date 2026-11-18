// Розподілене блокування слотів (T-4802). Тут лише правила без Redis: ключ
// лока, TTL резервації, backoff і типи помилок. Транспорт — у infrastructure.
import { uuidv7 } from '@fade/domain-shared';

/** 60 с на checkout: клієнт встигає ввести дані, слот не «залипає» надовго. */
export const SLOT_RESERVATION_TTL_MS = 60_000;
export const SLOT_LOCK_MAX_ATTEMPTS = 3;
export const SLOT_LOCK_BACKOFF_BASE_MS = 25;

/** Слот уже тримає інший клієнт (після всіх ретраїв) — HTTP 409. */
export class SlotLockedError extends Error {
  constructor(readonly key: string) {
    super('Slot is being booked by another client');
    this.name = 'SlotLockedError';
  }
}

/** Токен резервації недійсний, чужий або прострочений. */
export class ReservationInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationInvalidError';
  }
}

export interface SlotLockTarget {
  locationId: string;
  barberId?: string;
  start: Date;
}

/** Один слот = один ключ. «Будь-який барбер» теж серіалізується (any). */
export function slotLockKey(target: SlotLockTarget): string {
  const barber = target.barberId && target.barberId.trim() ? target.barberId : 'any';
  return `lock:slot:${target.locationId}:${barber}:${target.start.toISOString()}`;
}

export interface SlotReservation {
  key: string;
  token: string;
  expiresAt: Date;
}

export function newReservationToken(): string {
  return uuidv7();
}

/** Експоненційний backoff між спробами взяти лок (25 → 50 → 100 мс). */
export function backoffMs(attempt: number): number {
  return SLOT_LOCK_BACKOFF_BASE_MS * 2 ** Math.max(0, attempt);
}

export function isReservationExpired(reservation: SlotReservation, now: Date): boolean {
  return reservation.expiresAt.getTime() <= now.getTime();
}

export function assertReservationHeld(
  reservation: SlotReservation,
  holder: string | null,
  now: Date
): void {
  if (isReservationExpired(reservation, now)) {
    throw new ReservationInvalidError('Reservation has expired');
  }
  if (holder !== reservation.token) {
    throw new ReservationInvalidError('Reservation is no longer held');
  }
}
