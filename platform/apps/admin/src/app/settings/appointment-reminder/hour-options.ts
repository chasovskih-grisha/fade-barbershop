// Години нагадування «за N годин до візиту» (T-080). API зберігає хвилини
// (межі 15…10080), а UI говорить годинами: пресети + поточне значення, якщо
// воно поза пресетами, щоб селектор ніколи не спотворював чинне налаштування.
export const HOUR_PRESETS: readonly number[] = [1, 2, 3, 6, 12, 24, 48, 72, 168];
export const DEFAULT_HOURS = 24;

/** Хвилини → години для показу; менше години показуємо як 1 (пресет вище межі). */
export function hoursOf(leadMinutes: number): number {
  return Math.max(1, Math.round(leadMinutes / 60));
}

/** Опції селектора: пресети, відсортовані, із вставленим поточним значенням. */
export function hourOptions(leadMinutes: number): number[] {
  const current = hoursOf(leadMinutes);
  if (HOUR_PRESETS.includes(current)) return [...HOUR_PRESETS];
  return [...HOUR_PRESETS, current].sort((a, b) => a - b);
}

/** Підпис опції/рядка: українське скорочення годин, спільне для всіх чисел. */
export const hoursLabel = (hours: number): string => `${hours} год`;
