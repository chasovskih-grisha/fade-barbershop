// Снепшот умов депозиту на візиті (PAY-ADM-09): % і округлення фіксуються
// при записі, вікно скасування теж. Дедлайн рахуємо від поточного початку
// візиту, тож перенесення (reschedule) не лишає простроченого снепшота.

const HOUR_MS = 3_600_000;

/** Політика мережі (v1 — єдина; дефолти PAY-ADM-09). */
export interface DepositPolicy {
  /** Відсоток від ціни візиту; 0 — депозит вимкнено. */
  percent: number;
  /** Крок округлення суми в грн (1/5/10). */
  rounding: number;
  /** Вікно безкоштовного скасування, годин (0–72). */
  cancellationWindowHours: number;
}

export const DEFAULT_DEPOSIT_POLICY: DepositPolicy = {
  percent: 30,
  rounding: 10,
  cancellationWindowHours: 4,
};

/** Те, що візит зберігає про депозит; дедлайн — похідний від `start`. */
export interface DepositTerms {
  amount: number;
  percent: number;
  rounding: number;
  cancellationWindowHours: number;
}

/**
 * Умови депозиту для ціни візиту. `null` — грошей у візиті немає: політика
 * вимкнена, ціна 0 (ComplimentaryVisit, PAY-003) або сума після округлення 0
 * (Checkbox не приймає нульовий платіж — конфіг поводиться як «вимкнено»).
 */
export function depositTermsFor(
  price: number | null | undefined,
  policy: DepositPolicy = DEFAULT_DEPOSIT_POLICY
): DepositTerms | null {
  const amount = depositAmountFor(price, policy);
  if (amount === null) return null;
  return {
    amount,
    percent: percentOf(policy),
    rounding: roundingOf(policy),
    cancellationWindowHours: windowHoursOf(policy),
  };
}

/** Дедлайн безкоштовного скасування від початку візиту (снепшот вікна). */
export function freeCancelDeadline(start: Date, cancellationWindowHours: number): Date {
  return new Date(start.getTime() - cancellationWindowHours * HOUR_MS);
}

function depositAmountFor(price: number | null | undefined, policy: DepositPolicy) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  const percent = percentOf(policy);
  if (percent <= 0) return null;
  const rounding = roundingOf(policy);
  const amount = Math.min(price, Math.round((price * percent) / 100 / rounding) * rounding);
  return amount > 0 ? amount : null;
}

function percentOf(policy: DepositPolicy): number {
  if (!Number.isFinite(policy.percent) || policy.percent <= 0) return 0;
  return Math.min(100, Math.round(policy.percent));
}

function roundingOf(policy: DepositPolicy): number {
  return Number.isFinite(policy.rounding) && policy.rounding > 0 ? policy.rounding : 1;
}

function windowHoursOf(policy: DepositPolicy): number {
  if (!Number.isFinite(policy.cancellationWindowHours)) {
    return DEFAULT_DEPOSIT_POLICY.cancellationWindowHours;
  }
  return Math.min(72, Math.max(0, Math.round(policy.cancellationWindowHours)));
}
