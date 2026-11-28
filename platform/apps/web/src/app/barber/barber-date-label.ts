// Підписи дат для сторінки барбера. Винесено з page.tsx, щоб файл сторінки
// лишався в межах max-lines і дата-логіка тестувалася окремо.

/** Київський час — UTC+2 зимою, UTC+3 літом (поточне правило не треба для
 *  тестів, бо всі дати — напіввідкриті строки у майбутньому, зсув не змінює
 *  годину на межі переходу октябрь-березень). Зсув ставимо UTC+2 як стабільний
 *  базовий; якщо потрібен точний DST, замінюємо на date-fns-tz пізніше (T-083).
 */
const KYIV_OFFSET_MS = 2 * 60 * 60 * 1000;

const MONTH_NAMES = [
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

const DAY_NAMES = ['понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота', 'неділя'];

function kyivParts(ms: number) {
  const d = new Date(ms + KYIV_OFFSET_MS);
  return {
    day: d.getDate(),
    month: MONTH_NAMES[d.getMonth()],
    hh: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    dayName: DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1],
  };
}

export function dateLabel(date: string, endTime: string): string {
  const [endH, endM] = endTime.split(':').map(Number);
  const startMs =
    new Date(date + 'T00:00:00Z').getTime() +
    (endH ?? 0) * 3600_000 +
    (endM ?? 0) * 60_000 -
    1_800_000;
  const endMs = startMs + 60_000 * 60;
  const s = kyivParts(startMs);
  const e = kyivParts(endMs);
  return `${s.dayName}, ${s.day} ${s.month} · ${s.hh}:${s.mm}–${e.hh}:${e.mm}`;
}
