/**
 * T-4619a: утримання крісла під незаплачений депозит.
 *
 * Чистий домен без Nest/Prisma:
 *  - `openDepositHold` створює утримання на 15 хвилин (нульовий депозит не
 *    утримує крісло — PAY-003);
 *  - активне утримання блокує крісло для інших клієнтів;
 *  - прострочене утримання звільняє крісло, навіть якщо sweeper ще не встиг
 *    пройти (публічні слоти це враховують);
 *  - оплата в межах вікна переводить утримання в `captured`.
 */

export const DEPOSIT_HOLD_MINUTES = 15;

export type DepositHoldStatus = 'active' | 'captured' | 'expired' | 'cancelled';

export interface DepositHold {
  id: string;
  appointmentId: string;
  barberId: string;
  locationId: string;
  startAt: Date;
  endAt: Date;
  expiresAt: Date;
  status: DepositHoldStatus;
  depositAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DepositHoldError extends Error {
  constructor(
    readonly code: 'deposit_required' | 'invalid_window' | 'not_found',
    message: string
  ) {
    super(message);
    this.name = 'DepositHoldError';
  }
}

export interface OpenDepositHoldInput {
  id: string;
  appointmentId: string;
  barberId: string;
  locationId: string;
  startAt: Date;
  endAt: Date;
  depositAmount: number;
  now: Date;
  windowMinutes?: number;
}

/** Утримання відкривається лише під реальний депозит і коректний візит. */
export function openDepositHold(input: OpenDepositHoldInput): DepositHold {
  if (input.depositAmount <= 0) {
    throw new DepositHoldError('deposit_required', 'A deposit is required to hold the chair');
  }
  if (!(input.startAt < input.endAt)) {
    throw new DepositHoldError('invalid_window', 'Deposit hold must end after it starts');
  }
  const window = Math.max(1, input.windowMinutes ?? DEPOSIT_HOLD_MINUTES);
  return {
    id: input.id,
    appointmentId: input.appointmentId,
    barberId: input.barberId,
    locationId: input.locationId,
    startAt: input.startAt,
    endAt: input.endAt,
    expiresAt: new Date(input.now.getTime() + window * 60_000),
    status: 'active',
    depositAmount: input.depositAmount,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

/** Крісло зайняте, поки утримання активне і не прострочене. */
export function holdBlocksChair(hold: DepositHold, now: Date): boolean {
  return hold.status === 'active' && hold.expiresAt.getTime() > now.getTime();
}

/** Час вікна минув, а оплати не було — крісло можна звільняти. */
export function isHoldExpired(hold: DepositHold, now: Date): boolean {
  return hold.status === 'expired' || (hold.status === 'active' && hold.expiresAt <= now);
}

/**
 * Перехід у `expired`. Повертає `null`, якщо утримання ще діє, вже оплачене
 * або скасоване — тоді звільняти нічого.
 */
export function expireHold(hold: DepositHold, now: Date): DepositHold | null {
  if (hold.status !== 'active' || !isHoldExpired(hold, now)) return null;
  return { ...hold, status: 'expired', updatedAt: now };
}

/**
 * Оплата в межах вікна підтверджує крісло. Після прострочення оплата не
 * «воскрешає» утримання: крісло вже могло дістатися іншому клієнту.
 */
export function captureHold(
  hold: DepositHold,
  now: Date
): { hold: DepositHold; outcome: 'captured' | 'already_captured' | 'expired' | 'cancelled' } {
  if (hold.status === 'captured') return { hold, outcome: 'already_captured' };
  if (hold.status === 'cancelled') return { hold, outcome: 'cancelled' };
  if (hold.status === 'expired' || isHoldExpired(hold, now)) {
    const expired =
      hold.status === 'active' ? { ...hold, status: 'expired' as const, updatedAt: now } : hold;
    return { hold: expired, outcome: 'expired' };
  }
  return { hold: { ...hold, status: 'captured', updatedAt: now }, outcome: 'captured' };
}

/** Скасування клієнтом до оплати звільняє крісло одразу. */
export function cancelHold(hold: DepositHold, now: Date): DepositHold | null {
  if (hold.status !== 'active') return null;
  return { ...hold, status: 'cancelled', updatedAt: now };
}
