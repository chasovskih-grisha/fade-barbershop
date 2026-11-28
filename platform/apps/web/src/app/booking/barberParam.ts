// T-4477b: `?barber=` у флоу запису. Нечинний параметр (сміття, невідомий або
// чужий локації барбер) ігнорується — флоу відкривається звичайно, без помилки.
import type { BarberDto } from './types';

const MAX_LENGTH = 64;

/** Сирий параметр → кандидат у id. Пробіли, інший тип і надмірна довжина — null. */
export function readBarberParam(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (value === '' || value.length > MAX_LENGTH || /\s/.test(value)) return null;
  return value;
}

/** Кандидат лишається, лише коли барбер є серед виконавців цього кроку. */
export function pickBarber(raw: unknown, barbers: BarberDto[]): string | null {
  const id = readBarberParam(raw);
  if (id === null) return null;
  return barbers.some((barber) => barber.id === id) ? id : null;
}
