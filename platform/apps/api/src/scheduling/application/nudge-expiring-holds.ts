// T-091/T-4619: крісло звільняється через 15 хвилин, але клієнт дізнається про
// це вже постфактум. Цей прохід за 5 хвилин до дедлайну пише рівно одне
// нагадування в outbox — канал доставки (push/SMS/email) читає його як звичайну
// подію й не знає про дедлайни.
//
// Ідемпотентність — у порту `claim`: адаптер перевіряє, чи подія вже в outbox,
// і лише тоді пише нову. Тому повторний прохід, друга інстанція процесу або
// рестарт не дублюють нагадування.
import type { DepositHold } from '../domain/deposit-hold';
import type { DepositHoldRepository } from './deposit-hold.service';

/** Скільки лишається до дедлайну, коли варто нагадати. */
export const NUDGE_WINDOW_MS = 5 * 60 * 1000;

export interface ExpiringHoldNotice {
  appointmentId: string;
  barberId: string;
  locationId: string;
  depositAmount: number;
  expiresAt: Date;
  at: Date;
}

/**
 * Забирає право на нагадування. `true` — подію записано щойно, `false` — вона
 * вже є (повторний прохід нічого не робить).
 */
export interface ExpiringHoldNoticePort {
  claim(notice: ExpiringHoldNotice): Promise<boolean>;
}

export interface NudgeExpiringHoldsDeps {
  holds: Pick<DepositHoldRepository, 'listByStatus'>;
  notices: ExpiringHoldNoticePort;
  clock?: { now(): Date };
  /** Вікно до дедлайну; 0 — лише вже прострочені (не нагадуємо). */
  windowMs?: number;
}

export class NudgeExpiringHolds {
  constructor(private readonly deps: NudgeExpiringHoldsDeps) {}

  /** Повертає id візитів, яким нагадування записано саме цим проходом. */
  async run(): Promise<string[]> {
    const now = this.deps.clock?.now() ?? new Date();
    const windowMs = this.deps.windowMs ?? NUDGE_WINDOW_MS;
    const active = await this.deps.holds.listByStatus('active');

    const noticed: string[] = [];
    for (const hold of expiringWithin(active, now, windowMs)) {
      const claimed = await this.deps.notices.claim({
        appointmentId: hold.appointmentId,
        barberId: hold.barberId,
        locationId: hold.locationId,
        depositAmount: hold.depositAmount,
        expiresAt: hold.expiresAt,
        at: now,
      });
      if (claimed) noticed.push(hold.appointmentId);
    }
    return noticed;
  }
}

/** Активні утримання, чий дедлайн настає в межах вікна (і ще не минув). */
function expiringWithin(holds: DepositHold[], now: Date, windowMs: number): DepositHold[] {
  const from = now.getTime();
  const until = from + windowMs;
  return holds.filter((hold) => {
    if (hold.status !== 'active') return false;
    const deadline = hold.expiresAt.getTime();
    return deadline > from && deadline <= until;
  });
}
