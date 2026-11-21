// Повторний запис із завершеного візиту (T-4617b): чиста логіка поверх
// відповіді `GET /appointments/:id/book-again`. Застосунок не збирає власну
// форму слота — він відкриває той самий флоу запису з передзаповненням.
// Нечинне поле у параметри не потрапляє: флоу відкриється на кроці вибору.

import type { BookAgainIntent, BookAgainRef } from '../../../../lib/api/book-again';

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

function isUsable(ref: BookAgainRef | null): ref is BookAgainRef {
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

/** Параметри передзаповнення для флоу запису; нечинні поля відсутні. */
export function bookAgainParams(intent: BookAgainIntent): Record<string, string> {
  const params: Record<string, string> = {};
  if (isUsable(intent.location)) params.location = intent.location.id;
  if (isUsable(intent.service) && intent.service) params.service = intent.service.id;
  if (isUsable(intent.barber)) params.barber = intent.barber.id;
  return params;
}

/** Одне речення про те, що змінилося, або null, коли все чинне. */
export function bookAgainNotice(intent: BookAgainIntent): string | null {
  const stale = staleFields(intent);
  if (stale.length === 0) return null;
  const parts = stale.map((field) => `${FIELD_NAMES[field]} ${STALE_REASONS[field]}`);
  return `${parts.join(', ')} — оберіть заново`;
}
