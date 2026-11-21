// Оцінка пропускної здатності дня з політики слотів (T-4522, Risk: буфер
// скорочує пропускну здатність). Буфер додається до кожного блоку послуги,
// вирівняного на крок сітки, — звідси ефективний інтервал і кількість слотів.
import type { DayHours } from '../HoursEditor';
import type { PolicyValues } from './slot-policy-fields';

/** Репрезентативна послуга для оцінки: 30 хв — типова чоловіча стрижка. */
export const REPRESENTATIVE_SERVICE_MINUTES = 30;

/** Хвилини з «HH:MM»; невалідне значення — null. */
function toMinutes(time: string | null): number | null {
  if (!time) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Найдовший відкритий день тижня у хвилинах; без даних — 8 годин. */
export function openWindowMinutes(hours: DayHours[] | undefined): number {
  const fallback = 8 * 60;
  if (!hours?.length) return fallback;
  let longest = 0;
  for (const day of hours) {
    if (day.closed) continue;
    const open = toMinutes(day.open);
    const close = toMinutes(day.close);
    if (open === null || close === null || close <= open) continue;
    longest = Math.max(longest, close - open);
  }
  return longest > 0 ? longest : fallback;
}

/** Ефективний інтервал між початками: блок послуги на кроці сітки + буфер. */
export function effectiveSlotMinutes(
  stepMinutes: number,
  bufferMinutes: number,
  serviceMinutes = REPRESENTATIVE_SERVICE_MINUTES
): number {
  const step = stepMinutes > 0 ? stepMinutes : 1;
  const blocks = Math.max(1, Math.ceil(serviceMinutes / step));
  return blocks * step + Math.max(0, bufferMinutes);
}

/** Оцінка кількості слотів за вікно роботи (у хвилинах). */
export function estimateDailySlots(
  values: PolicyValues,
  windowMinutes: number,
  serviceMinutes = REPRESENTATIVE_SERVICE_MINUTES
): number {
  const effective = effectiveSlotMinutes(values.stepMinutes, values.bufferMinutes, serviceMinutes);
  return effective <= 0 ? 0 : Math.floor(windowMinutes / effective);
}

/** Підпис оцінки для адмінки: без hex/px, лише текст. */
export function capacityEstimateLabel(values: PolicyValues, hours?: DayHours[]): string {
  const windowMinutes = openWindowMinutes(hours);
  const slots = estimateDailySlots(values, windowMinutes);
  const hoursLabel = Math.round(windowMinutes / 60);
  return `≈ ${slots} слотів за ${hoursLabel}-годинний день (послуга ${REPRESENTATIVE_SERVICE_MINUTES} хв).`;
}
