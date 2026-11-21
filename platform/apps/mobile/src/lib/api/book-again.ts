import { apiBase } from './api-base';

/** Поле, яке можна підставити у флоу запису. `stale` — більше не чинне. */
export interface BookAgainRef {
  id: string;
  name: string;
  stale: boolean;
}

/**
 * Відповідь `GET /appointments/:id/book-again` (T-4617a). Нічого не створює
 * і не тримає слот: це намір, а не візит.
 */
export interface BookAgainIntent {
  location: BookAgainRef;
  service: BookAgainRef | null;
  barber: BookAgainRef;
  /** Поточна ціна локації; null — ціни немає (не вигадуємо число). */
  price: number | null;
}

export async function getBookAgainIntent(appointmentId: string): Promise<BookAgainIntent> {
  const res = await fetch(`${apiBase()}/appointments/${appointmentId}/book-again`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `API ${res.status}`);
  }
  return (await res.json()) as BookAgainIntent;
}
