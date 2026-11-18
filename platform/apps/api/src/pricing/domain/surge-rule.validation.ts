// Валідація адмінського правила surge (T-4811): некоректне правило не
// зберігаємо, бо воно або не спрацює, або здешевить візит — обидва варіанти
// виглядають як баг у цінах, а не як помилка вводу.
import type { SeniorityTier } from './surge-rule';

export const SENIORITY_TIERS: readonly SeniorityTier[] = ['junior', 'middle', 'senior', 'top'];

export interface SurgeRuleInput {
  dayOfWeek?: number | null;
  fromMinute?: number | null;
  toMinute?: number | null;
  seniorityTier?: string | null;
  multiplierBp?: number;
}

export type ValidationResult = { ok: true } | { ok: false; message: string };

function checkDayOfWeek(dayOfWeek: number | null | undefined): ValidationResult {
  if (dayOfWeek !== null && dayOfWeek !== undefined && (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)) {
    return { ok: false, message: 'dayOfWeek must be an integer 0..6' };
  }
  return { ok: true };
}

function checkWindowFromto(fromMinute: number, toMinute: number): ValidationResult {
  if (!Number.isInteger(fromMinute) || !Number.isInteger(toMinute)) {
    return { ok: false, message: 'fromMinute/toMinute must be integers' };
  }
  if (fromMinute < 0 || toMinute > 1440 || fromMinute >= toMinute) {
    return { ok: false, message: 'window must satisfy 0 <= fromMinute < toMinute <= 1440' };
  }
  return { ok: true };
}

function checkWindowValidation(fromMinute: number | null, toMinute: number | null): ValidationResult {
  const hasFrom = fromMinute !== null && fromMinute !== undefined;
  const hasTo = toMinute !== null && toMinute !== undefined;
  if (hasFrom !== hasTo) return { ok: false, message: 'fromMinute and toMinute must be set together' };
  if (hasFrom && hasTo) {
    return checkWindowFromto(fromMinute, toMinute);
  }
  return { ok: true };
}

export function validateSurgeRule(input: SurgeRuleInput): ValidationResult {
  const { dayOfWeek, fromMinute, toMinute, seniorityTier, multiplierBp } = input;
  const d = checkDayOfWeek(dayOfWeek);
  if (!d.ok) return d;
  const w = checkWindowValidation(fromMinute, toMinute);
  if (!w.ok) return w;
  const s = checkSeniorityTier(seniorityTier);
  if (!s.ok) return s;
  const m = checkMultiplierBp(multiplierBp);
  if (!m.ok) return m;
  return { ok: true };
}