// Повторний запис із завершеного візиту (T-4617b): чиста логіка поверх
// відповіді `GET /appointments/:id/book-again` (T-4617a). Кнопка будує
// посилання у наявний флоу запису — жодного власного майстра слота.
// Нечинне поле (stale) у посилання не потрапляє: флоу відкриється на кроці
// вибору цього поля, а не впаде на слоті.

import type { BookAgainIntent, BookAgainRef } from '@/lib/api/appointment-types';

export type { BookAgainIntent, BookAgainRef } from '@/lib/api/appointment-types';

/** Мітка поля, яке не потрапляє у флоу — для повідомлення клієнту. */
export type StaleField = 'location' | 'service' | 'barber';

const FIELD_NAMES: Record<StaleField, string> = {
  location: 'локація',
  service: 'послуга',
  barber: 'барбер',
};

const STALE_REASONS: Record<StaleField, string> = {
  location: 'більше не приймає записів',
  service: 'більше не виконується',
  barber: 'більше не виконує цю послугу',
};

function isUsable(ref: BookAgainRef | null): boolean {
  return ref !== null && !ref.stale;
}

/** Поля, які доведеться обрати заново: нечинні або відсутні. */
export function staleFields(intent: BookAgainIntent): StaleField[] {
  const stale: StaleField[] = [];
  if (!isUsable(intent.location)) stale.push('location');
  if (!isUsable(intent.service)) stale.push('service');
  if (!isUsable(intent.barber)) stale.push('barber');
  return stale;
}

/**
 * Посилання у флоу запису з чинними полями. Порожнє — нічого не підставляємо
 * (флоу відкриється з першого кроку). Порядок полів стабільний: location,
 * service, barber.
 */
export function bookAgainHref(intent: BookAgainIntent): string {
  const params = new URLSearchParams();
  if (isUsable(intent.location)) params.set('location', intent.location.id);
  if (isUsable(intent.service) && intent.service) params.set('service', intent.service.id);
  if (isUsable(intent.barber)) params.set('barber', intent.barber.id);
  const query = params.toString();
  return query ? `/booking?${query}` : '/booking';
}

/**
 * Одне речення про те, що змінилося, або null, коли все чинне. Порожньої
 * помилки немає: клієнт бачить, яке саме поле треба обрати заново.
 */
export function bookAgainNotice(intent: BookAgainIntent): string | null {
  const stale = staleFields(intent);
  if (stale.length === 0) return null;
  const parts = stale.map((field) => `${FIELD_NAMES[field]} ${STALE_REASONS[field]}`);
  return `${parts.join(', ')} — оберіть заново`;
}

/** Параметри передзаповнення, які читає флоу запису. */
export interface BookAgainParams {
  location: string | null;
  service: string | null;
  barber: string | null;
}

/** Розбір query-параметрів флоу: відсутній або порожній → null. */
export function readBookAgainParams(search: string): BookAgainParams {
  const params = new URLSearchParams(search);
  const read = (key: string): string | null => {
    const value = params.get(key);
    return value && value.length > 0 ? value : null;
  };
  return { location: read('location'), service: read('service'), barber: read('barber') };
}
