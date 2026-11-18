// День народження без року (T-4730b): днів у місяці, українська назва місяця
// в родовому відмінку і показ «12 листопада». Рік не питаємо.
export interface Birthday {
  day: number;
  month: number;
}

const MONTHS_GENITIVE = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function daysInMonth(month: number): number {
  return DAYS_IN_MONTH[month - 1] ?? 31;
}

/** День, зменшений до межі місяця: 31 + лютий → 29. 0 (не вибрано) лишається. */
export function clampDay(day: number, month: number): number {
  if (day <= 0 || month <= 0) return day;
  return Math.min(day, daysInMonth(month));
}

/** Показ без року: 12 листопада. Порожнє — порожній рядок. */
export function formatBirthday(birthday: Birthday | null): string {
  if (!birthday) return '';
  const month = MONTHS_GENITIVE[birthday.month - 1];
  return month ? `${birthday.day} ${month}` : '';
}
