/**
 * T-4464: «слабкі години» — чиста read-модель для оператора.
 *
 * Рахуємо заповненість по днях і годинах за вікно (типово 2 тижні) з фактів
 * записів (T-061/T-111) і підсвічуємо вікна нижче порогу. Для кожного вікна —
 * одна конкретна дія з прев'ю: промо (T-152), зсув графіка (T-4415) або
 * нагадування клієнтам (T-080).
 *
 * Поріг і години роботи — конфіг, не hardcode: сезонність без ML не
 * вгадується, тож оператор має крутити поріг сам (ризик «помилкова ціль»).
 * Час — Europe/Kyiv, як у решті доменних текстів.
 */

export const SLOW_HOURS_TIME_ZONE = 'Europe/Kyiv';

export interface OccupancyFact {
  start: Date;
  end: Date;
}

export interface SlowHoursConfig {
  /** Скільки днів назад дивимось (1..60). */
  windowDays: number;
  /** Заповненість нижче цього відсотка — «слабка година». */
  thresholdPercent: number;
  /** Локальна година відкриття (включно). */
  openHour: number;
  /** Локальна година закриття (не включно). */
  closeHour: number;
  /** Скільки крісел/барберів одночасно доступні в локації. */
  chairs: number;
  timeZone: string;
}

export const SLOW_HOURS_DEFAULTS: SlowHoursConfig = {
  windowDays: 14,
  thresholdPercent: 40,
  openHour: 9,
  closeHour: 21,
  chairs: 2,
  timeZone: SLOW_HOURS_TIME_ZONE,
};

export type SlowHoursActionType = 'promo' | 'schedule_shift' | 'reminder';

export interface SlowHoursAction {
  type: SlowHoursActionType;
  label: string;
  /** Готовий текст для картки оператора; дані не вигадані — з вікна. */
  preview: string;
}

export interface OccupancyCell {
  /** Локальна дата `YYYY-MM-DD`. */
  date: string;
  hour: number;
  bookedMinutes: number;
  availableMinutes: number;
  occupancyPercent: number;
}

export interface WeakWindow extends OccupancyCell {
  action: SlowHoursAction;
}

export interface WeekdayOccupancy {
  /** 1 — понеділок … 7 — неділя. */
  weekday: number;
  label: string;
  bookedMinutes: number;
  availableMinutes: number;
  occupancyPercent: number;
}

export interface SlowHoursReport {
  period: { from: string; to: string; windowDays: number };
  config: SlowHoursConfig;
  cells: OccupancyCell[];
  weakWindows: WeakWindow[];
  byWeekday: WeekdayOccupancy[];
  /** Підказки оператору: «слабка година — чому не кампанія?». */
  alerts: string[];
  /** Чи було достатньо даних, щоб взагалі щось радити. */
  hasEnoughData: boolean;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** Менше днів даних — підказка може бути шумом; показуємо, але позначаємо. */
export const MIN_DATA_DAYS = 3;

const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];

/** Локальні частини часу (рік/місяць/день/година) у таймзоні. */
export function zonedParts(
  at: Date,
  timeZone: string = SLOW_HOURS_TIME_ZONE
): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(at);

  const pick = (type: string): number =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10);

  return { year: pick('year'), month: pick('month'), day: pick('day'), hour: pick('hour') };
}

export function localDateKey(at: Date, timeZone: string = SLOW_HOURS_TIME_ZONE): string {
  const { year, month, day } = zonedParts(at, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function offsetMs(at: Date, timeZone: string): number {
  const { year, month, day, hour } = zonedParts(at, timeZone);
  const asUtc = Date.UTC(year, month - 1, day, hour, at.getUTCMinutes());
  return asUtc - at.getTime();
}

/** UTC-момент локальної дати й години (Europe/Kyiv, без DST-крайових годин). */
export function utcFromLocal(
  date: string,
  hour: number,
  timeZone: string = SLOW_HOURS_TIME_ZONE,
  reference: Date = new Date()
): Date {
  const [year, month, day] = date.split('-').map((part) => Number.parseInt(part, 10));
  const guess = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, hour, 0, 0);
  return new Date(guess - offsetMs(reference, timeZone));
}

/** Дати вікна від `now - windowDays + 1` до `now` (локальні, включно). */
export function windowDates(now: Date, windowDays: number, timeZone: string): string[] {
  const end = localDateKey(now, timeZone);
  const dates: string[] = [];
  for (let back = windowDays - 1; back >= 0; back -= 1) {
    const at = new Date(now.getTime() - back * DAY_MS);
    const key = localDateKey(at, timeZone);
    if (!dates.includes(key)) dates.push(key);
  }
  if (!dates.includes(end)) dates.push(end);
  return dates;
}

function weekdayFor(date: string): number {
  const [year, month, day] = date.split('-').map((part) => Number.parseInt(part, 10));
  const jsDay = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

/** Заповненість по годинах робочого дня; факти поза годинами не рахуються. */
export function occupancyCells(
  facts: OccupancyFact[],
  now: Date,
  config: SlowHoursConfig
): OccupancyCell[] {
  const cells: OccupancyCell[] = [];
  const dates = windowDates(now, config.windowDays, config.timeZone);

  for (const date of dates) {
    for (let hour = config.openHour; hour < config.closeHour; hour += 1) {
      const from = utcFromLocal(date, hour, config.timeZone, now).getTime();
      const to = from + 60 * MINUTE_MS;
      const bookedMinutes = facts.reduce((total, fact) => {
        const overlap = Math.min(fact.end.getTime(), to) - Math.max(fact.start.getTime(), from);
        return total + (overlap > 0 ? Math.round(overlap / MINUTE_MS) : 0);
      }, 0);
      const availableMinutes = 60 * Math.max(1, config.chairs);

      cells.push({
        date,
        hour,
        bookedMinutes: Math.min(bookedMinutes, availableMinutes),
        availableMinutes,
        occupancyPercent: Math.min(
          100,
          Math.round((bookedMinutes / availableMinutes) * 100)
        ),
      });
    }
  }

  return cells;
}

/** Дія для конкретного слабкого вікна — детермінована, без «порад взагалі». */
export function suggestAction(cell: OccupancyCell): SlowHoursAction {
  const when = `${WEEKDAY_LABELS[weekdayFor(cell.date) - 1]}, ${String(cell.hour).padStart(2, '0')}:00`;

  if (cell.bookedMinutes === 0) {
    return {
      type: 'schedule_shift',
      label: 'Зсунути графік',
      preview: `${when} — 0 записів. Закрийте цю годину або перенесіть зміну барбера.`,
    };
  }

  return {
    type: 'promo',
    label: 'Промо-кампанія',
    preview: `${when} заповнено на ${cell.occupancyPercent}%. Промо-код на цю годину або нагадування клієнтам.`,
  };
}

/** Слабкі вікна: нижче порогу, найгірші спершу; майбутні години не радимо. */
export function weakWindows(
  cells: OccupancyCell[],
  now: Date,
  config: SlowHoursConfig,
  limit: number = 10
): WeakWindow[] {
  const nowMs = now.getTime();

  return cells
    .filter((cell) => {
      const startsAt = utcFromLocal(cell.date, cell.hour, config.timeZone, now).getTime();
      const endsAt = startsAt + 60 * MINUTE_MS;
      if (endsAt > nowMs) return false; // година ще не закінчилась
      return cell.occupancyPercent < config.thresholdPercent;
    })
    .sort((a, b) => {
      if (a.occupancyPercent !== b.occupancyPercent) {
        return a.occupancyPercent - b.occupancyPercent;
      }
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.hour - b.hour;
    })
    .slice(0, Math.max(1, limit))
    .map((cell) => ({ ...cell, action: suggestAction(cell) }));
}

/** Агрегат по днях тижня — «вівторок завжди провалюється». */
export function weekdayOccupancy(cells: OccupancyCell[]): WeekdayOccupancy[] {
  const buckets = new Map<number, { booked: number; available: number }>();

  for (const cell of cells) {
    const weekday = weekdayFor(cell.date);
    const bucket = buckets.get(weekday) ?? { booked: 0, available: 0 };
    bucket.booked += cell.bookedMinutes;
    bucket.available += cell.availableMinutes;
    buckets.set(weekday, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekday, bucket]) => ({
      weekday,
      label: WEEKDAY_LABELS[weekday - 1] ?? '',
      bookedMinutes: bucket.booked,
      availableMinutes: bucket.available,
      occupancyPercent:
        bucket.available === 0 ? 0 : Math.round((bucket.booked / bucket.available) * 100),
    }));
}

/** Підказки оператору: топ-3 слабких вікна з питанням «чому не кампанія?». */
export function slowHourAlerts(weak: WeakWindow[]): string[] {
  return weak.slice(0, 3).map((window) => {
    const when = `${WEEKDAY_LABELS[weekdayFor(window.date) - 1]}, ${String(window.hour).padStart(2, '0')}:00`;
    return `Слабка година: ${when} — ${window.occupancyPercent}% заповнення. Чому не ${window.action.label.toLowerCase()}?`;
  });
}

/** Повний звіт: клітинки, слабкі вікна, агрегат і підказки. */
export function slowHoursReport(
  facts: OccupancyFact[],
  now: Date,
  config: SlowHoursConfig = SLOW_HOURS_DEFAULTS
): SlowHoursReport {
  const cells = occupancyCells(facts, now, config);
  const weak = weakWindows(cells, now, config);
  const dates = [...new Set(cells.map((cell) => cell.date))];

  return {
    period: {
      from: dates[0] ?? localDateKey(now, config.timeZone),
      to: dates[dates.length - 1] ?? localDateKey(now, config.timeZone),
      windowDays: config.windowDays,
    },
    config,
    cells,
    weakWindows: weak,
    byWeekday: weekdayOccupancy(cells),
    alerts: slowHourAlerts(weak),
    hasEnoughData: dates.length >= MIN_DATA_DAYS,
  };
}

/** Валідація параметрів запиту — 400 у контролері, без Nest у домені. */
export function validateSlowHoursParams(input: {
  days?: number;
  thresholdPercent?: number;
  chairs?: number;
  openHour?: number;
  closeHour?: number;
}): string[] {
  const errors: string[] = [];
  const { days, thresholdPercent, chairs, openHour, closeHour } = input;
  if (days !== undefined && (!Number.isInteger(days) || days < 1 || days > 60)) {
    errors.push('days must be 1..60');
  }
  if (
    thresholdPercent !== undefined &&
    (!Number.isInteger(thresholdPercent) || thresholdPercent < 1 || thresholdPercent > 100)
  ) {
    errors.push('thresholdPercent must be 1..100');
  }
  if (chairs !== undefined && (!Number.isInteger(chairs) || chairs < 1 || chairs > 50)) {
    errors.push('chairs must be 1..50');
  }
  if (openHour !== undefined && (!Number.isInteger(openHour) || openHour < 0 || openHour > 23)) {
    errors.push('openHour must be 0..23');
  }
  if (closeHour !== undefined && (!Number.isInteger(closeHour) || closeHour < 1 || closeHour > 24)) {
    errors.push('closeHour must be 1..24');
  }
  if (openHour !== undefined && closeHour !== undefined && closeHour <= openHour) {
    errors.push('closeHour must be after openHour');
  }
  return errors;
}
