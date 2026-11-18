// Поля політики депозиту (PAY-ADM-09): рядки форми ↔ числа API. Валідація тут,
// щоб форма не могла надіслати 250% або вікно 200 год — API такі значення
// відкидає, і адмін бачив би «збережено» без змін.
export interface DepositPolicy {
  percent: number;
  rounding: number;
  cancellationWindowHours: number;
}

export interface DepositPolicyDraft {
  percent: string;
  rounding: number;
  cancellationWindowHours: string;
}

/** Кроки округлення, які приймає PAY-ADM-09. */
export const ROUNDING_OPTIONS: readonly number[] = [1, 5, 10];

/** Спільний стиль полів форми (design-system.md: без hex, лише токени). */
export const FIELD_CLASS =
  'h-11 w-full rounded-input border border-line bg-surface-base px-3 text-body text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

export const PERCENT_RANGE = { min: 0, max: 100 } as const;
export const WINDOW_RANGE = { min: 0, max: 72 } as const;

export function toDraft(policy: DepositPolicy): DepositPolicyDraft {
  return {
    percent: String(policy.percent),
    rounding: policy.rounding,
    cancellationWindowHours: String(policy.cancellationWindowHours),
  };
}

/** Текст помилки для першого невалідного поля; null — форма готова до PUT. */
export function draftError(draft: DepositPolicyDraft): string | null {
  const percent = intOf(draft.percent);
  if (percent === null || percent < PERCENT_RANGE.min || percent > PERCENT_RANGE.max) {
    return `Відсоток депозиту — ціле число ${PERCENT_RANGE.min}–${PERCENT_RANGE.max}.`;
  }
  if (!ROUNDING_OPTIONS.includes(draft.rounding)) {
    return 'Округлення — одне зі значень 1, 5 або 10 грн.';
  }
  const window = intOf(draft.cancellationWindowHours);
  if (window === null || window < WINDOW_RANGE.min || window > WINDOW_RANGE.max) {
    return `Вікно скасування — ціле число ${WINDOW_RANGE.min}–${WINDOW_RANGE.max} годин.`;
  }
  return null;
}

export function toPolicy(draft: DepositPolicyDraft): DepositPolicy {
  return {
    percent: Number(draft.percent),
    rounding: draft.rounding,
    cancellationWindowHours: Number(draft.cancellationWindowHours),
  };
}

/** Ціле число з рядка; порожній/дробовий рядок — null (не мовчазний 0). */
function intOf(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value);
}
