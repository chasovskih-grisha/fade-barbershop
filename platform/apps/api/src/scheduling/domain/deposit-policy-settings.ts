// Адмін-налаштування політики депозиту (PAY-ADM-09): відсоток, округлення і
// вікно скасування живуть в AppSetting, а не в коді. Значення читає запис
// візиту (снепшот на Booking), тому зміна діє лише на нові записи.
import { DEFAULT_DEPOSIT_POLICY, type DepositPolicy } from './deposit-terms';

/** Крок округлення суми, який дозволяє адмінка (грн). */
export const DEPOSIT_ROUNDING_OPTIONS = [1, 5, 10] as const;

export const DEPOSIT_POLICY_SETTING_KEY = 'billing.depositPolicy';

/**
 * Валідує JSON AppSetting у політику. Відсутнє або зіпсоване поле деградує до
 * дефолту PAY-ADM-09; відсоток і вікно затискаються в свої діапазони, щоб
 * поганий рядок у БД не зробив візит неоплатним.
 */
export function parseDepositPolicySettings(raw: unknown): DepositPolicy {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as {
    percent?: unknown;
    rounding?: unknown;
    cancellationWindowHours?: unknown;
  };
  return {
    percent: intInRange(input.percent, { min: 0, max: 100 }, DEFAULT_DEPOSIT_POLICY.percent),
    rounding: roundingOf(input.rounding),
    cancellationWindowHours: intInRange(
      input.cancellationWindowHours,
      { min: 0, max: 72 },
      DEFAULT_DEPOSIT_POLICY.cancellationWindowHours
    ),
  };
}

/** Політика разом із номером версії (T-4444: історія правил). */
export interface VersionedDepositPolicy extends DepositPolicy {
  readonly version: number;
}

/** Рядок історії: з чим саме погоджувався клієнт на момент запису. */
export interface DepositPolicyVersionRow extends VersionedDepositPolicy {
  readonly createdAt: Date;
  readonly createdBy: string | null;
}

export const DEFAULT_POLICY_VERSION = 1;

export interface DepositPolicySettingsPort {
  get(): Promise<DepositPolicy>;
}

/** Версія з JSON AppSetting; відсутня/зіпсована — 1. */
export function parsePolicyVersion(raw: unknown): number {
  const value = (typeof raw === 'object' && raw !== null ? raw : {}) as { version?: unknown };
  return typeof value.version === 'number' && Number.isFinite(value.version) && value.version >= 1
    ? Math.floor(value.version)
    : DEFAULT_POLICY_VERSION;
}

/** Чи змінилося хоч одне грошове правило — версію інкрементуємо лише тоді. */
export function sameDepositPolicy(a: DepositPolicy, b: DepositPolicy): boolean {
  return (
    a.percent === b.percent &&
    a.rounding === b.rounding &&
    a.cancellationWindowHours === b.cancellationWindowHours
  );
}

function intInRange(input: unknown, range: { min: number; max: number }, fallback: number): number {
  if (typeof input !== 'number' || !Number.isFinite(input)) return fallback;
  return Math.min(range.max, Math.max(range.min, Math.round(input)));
}

function roundingOf(input: unknown): number {
  const step = typeof input === 'number' ? input : NaN;
  return DEPOSIT_ROUNDING_OPTIONS.includes(step as (typeof DEPOSIT_ROUNDING_OPTIONS)[number])
    ? step
    : DEFAULT_DEPOSIT_POLICY.rounding;
}
