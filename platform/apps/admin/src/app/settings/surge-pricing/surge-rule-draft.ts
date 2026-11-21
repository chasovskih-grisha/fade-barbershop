// Чернетка правила surge (T-4811): рядки форми ↔ тіло PUT. Межі ті самі, що
// перевіряє API (10000…50000 bp, вікно парою, день 0..6): інакше адмін бачив
// би «збережено» на значенні, яке сервер відкинув.
export type SeniorityTier = 'junior' | 'middle' | 'senior' | 'top';

export interface SurgeRuleRow {
  id: string;
  locationId: string | null;
  dayOfWeek: number | null;
  fromMinute: number | null;
  toMinute: number | null;
  seniorityTier: SeniorityTier | null;
  multiplierBp: number;
  active: boolean;
}

export interface SurgeRuleDraft {
  locationId: string;
  dayOfWeek: string;
  fromTime: string;
  toTime: string;
  seniorityTier: string;
  multiplierPercent: string;
}

export interface SurgeRulePayload {
  locationId: string | null;
  dayOfWeek: number | null;
  fromMinute: number | null;
  toMinute: number | null;
  seniorityTier: SeniorityTier | null;
  multiplierBp: number;
}

export const PERCENT_RANGE = { min: 100, max: 500 } as const;

export const EMPTY_DRAFT: SurgeRuleDraft = {
  locationId: '',
  dayOfWeek: '',
  fromTime: '',
  toTime: '',
  seniorityTier: '',
  multiplierPercent: '125',
};

/** Хвилини від початку доби → `HH:MM` для `<input type="time">`. */
export function minutesToTime(minute: number | null): string {
  if (minute === null) return '';
  const hh = String(Math.floor(minute / 60)).padStart(2, '0');
  const mm = String(minute % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** `HH:MM` → хвилини; порожній або кривий рядок — null (не мовчазний 0). */
export function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function toDraft(row: SurgeRuleRow): SurgeRuleDraft {
  return {
    locationId: row.locationId ?? '',
    dayOfWeek: row.dayOfWeek === null ? '' : String(row.dayOfWeek),
    fromTime: minutesToTime(row.fromMinute),
    toTime: minutesToTime(row.toMinute),
    seniorityTier: row.seniorityTier ?? '',
    multiplierPercent: String(row.multiplierBp / 100),
  };
}

/** Текст помилки для першого невалідного поля; null — форма готова до PUT. */
export function draftError(draft: SurgeRuleDraft): string | null {
  const percent = Number(draft.multiplierPercent);
  const blank = draft.multiplierPercent.trim() === '';
  if (
    blank ||
    !Number.isFinite(percent) ||
    percent < PERCENT_RANGE.min ||
    percent > PERCENT_RANGE.max
  ) {
    return `Множник — ${PERCENT_RANGE.min}–${PERCENT_RANGE.max}% (нижче 100% ціну не знижуємо).`;
  }
  const hasFrom = draft.fromTime.trim() !== '';
  if (hasFrom !== (draft.toTime.trim() !== '')) return 'Вікно — обидві межі разом.';
  if (hasFrom) {
    const from = timeToMinutes(draft.fromTime);
    const to = timeToMinutes(draft.toTime);
    if (from === null || to === null || from >= to)
      return 'Вікно — від початку до кінця, від < до.';
  }
  return null;
}

export function toPayload(draft: SurgeRuleDraft): SurgeRulePayload {
  return {
    locationId: draft.locationId === '' ? null : draft.locationId,
    dayOfWeek: draft.dayOfWeek === '' ? null : Number(draft.dayOfWeek),
    fromMinute: timeToMinutes(draft.fromTime),
    toMinute: timeToMinutes(draft.toTime),
    seniorityTier: draft.seniorityTier === '' ? null : (draft.seniorityTier as SeniorityTier),
    multiplierBp: Math.round(Number(draft.multiplierPercent) * 100),
  };
}
