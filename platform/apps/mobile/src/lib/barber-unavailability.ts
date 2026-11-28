// T-4616b: чиста логіка екрана «не вийду». Екран лише малює результат:
// доба перетворюється на інтервал, який приймає `MarkBarberUnavailable`, а
// текст після позначки залежить від кількості відкритих конфліктів.

export interface DayChoice {
  /** `YYYY-MM-DD` у локальній добі пристрою. */
  date: string;
  label: string;
}

const WEEKDAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Повна локальна доба `[00:00, наступна 00:00)`; null — дата некоректна. */
export function fullDayInterval(date: string): { start: string; end: string } | null {
  const match = DAY_RE.exec(date);
  if (!match) return null;
  const start = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    Number.isNaN(start.getTime()) ||
    start.getFullYear() !== Number(match[1]) ||
    start.getMonth() !== Number(match[2]) - 1 ||
    start.getDate() !== Number(match[3])
  ) {
    return null;
  }
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Найближчі дні для вибору: «Ср 11.09». */
export function upcomingDays(from: string, count = 7): DayChoice[] {
  const match = DAY_RE.exec(from);
  if (!match) return [];
  const base = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(base.getTime())) return [];
  const days: DayChoice[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const day = new Date(base.getTime());
    day.setDate(day.getDate() + offset);
    const iso = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    days.push({ date: iso, label: `${WEEKDAYS[day.getDay()]} ${pad(day.getDate())}.${pad(day.getMonth() + 1)}` });
  }
  return days;
}

/** Локальна дата «сьогодні» у форматі `YYYY-MM-DD` (без UTC-зсуву). */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Що барбер бачить після позначки: день чекає рішення засновника. */
export function unavailabilityNotice(conflictsCreated: number): string {
  if (conflictsCreated <= 0) {
    return 'День позначено вихідним. Візитів на цю дату немає — рішення не потрібне.';
  }
  const verb = conflictsCreated === 1 ? 'чекає' : 'чекають';
  return `День позначено вихідним. ${countVisits(conflictsCreated)} ${verb} рішення засновника — клієнтів переносить адміністратор.`;
}

/** «1 візит», «2 візити», «5 візитів» — спільний відмінок для будь-якого тексту. */
export function countVisits(count: number): string {
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return `${count} візитів`;
  switch (count % 10) {
    case 1:
      return `${count} візит`;
    case 2:
    case 3:
    case 4:
      return `${count} візити`;
    default:
      return `${count} візитів`;
  }
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}
