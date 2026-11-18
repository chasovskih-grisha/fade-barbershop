// День народження без року (T-4730c): днів у місяці та показ «12 листопада».
// Той самий контракт, що на сайті (T-4730b): рік не питаємо.
export interface Birthday {
  day: number;
  month: number;
}

export const MONTH_NAMES = [
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

/** Показ без року: 12 листопада. Порожнє — порожній рядок. */
export function formatBirthday(birthday: Birthday | null): string {
  if (!birthday) return '';
  const month = MONTH_NAMES[birthday.month - 1];
  return month ? `${birthday.day} ${month}` : '';
}
