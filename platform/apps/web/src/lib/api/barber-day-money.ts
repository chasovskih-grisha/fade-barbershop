// Гроші дня барбера (T-4404): read-only зведення GET /barber/payments/day-summary.
// Рахує сервер по київській добі — UI не складає суми сам і не вгадує межі дня.

export interface BarberDayMoney {
  date: string;
  visits: number;
  completed: number;
  expected: number;
  collected: number;
  outstanding: number;
  byForm: { cash: number; pos: number; card: number; certificate: number };
}

/** `null` — бекенд не відповів даними (сторінка не показує вигаданих нулів). */
export async function fetchBarberDayMoney(date: string): Promise<BarberDayMoney | null> {
  const res = await fetch(`/api/barber/day-summary?date=${encodeURIComponent(date)}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as Partial<BarberDayMoney> | null;
  if (!body || typeof body.collected !== 'number') return null;
  return body as BarberDayMoney;
}
