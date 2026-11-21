// Підписи правила surge для списку (T-4811): адмін читає «Пт 18:00–21:00 ·
// senior · ×1.25», а не набір id. null-обмеження = «будь-який», тому рядок
// ніколи не порожній.
import type { SeniorityTier, SurgeRuleRow } from './surge-rule-draft';

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] as const;

const clock = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

/** Множник у відсотках без зайвих нулів: 12500 bp → «×1.25», 11000 → «×1.1». */
export function multiplierLabel(multiplierBp: number): string {
  return `×${Number((multiplierBp / 10_000).toFixed(2))}`;
}

/** Коли діє правило: день, вікно і рівень барбера одним рядком. */
export function ruleScope(row: SurgeRuleRow): string {
  const day = row.dayOfWeek === null ? 'Будь-який день' : (DAY_LABELS[row.dayOfWeek] ?? '—');
  const window =
    row.fromMinute === null || row.toMinute === null
      ? 'весь день'
      : `${clock(row.fromMinute)}–${clock(row.toMinute)}`;
  const tier = row.seniorityTier === null ? 'будь-який рівень' : TIER_LABELS[row.seniorityTier];
  return `${day} · ${window} · ${tier}`;
}

export const TIER_LABELS: Record<SeniorityTier, string> = {
  junior: 'junior',
  middle: 'middle',
  senior: 'senior',
  top: 'top',
};
