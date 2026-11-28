// Клієнтський шар оплати на місці для барбера на веб-сайті.
// Автентифікація — cookie fadoidx (credentials: include), як у кабінеті клієнта.
// Токени не передаються в URL і не кладуться в заголовки вручну — сесію кладе
// SameSite cookie, а сервер (/barber/payments) довіряє саме її (ClientSessionGuard).
import { apiBase } from './api-base';

export type BarberOnsiteForm = 'cash' | 'pos';

// Вузька поверхня барбера: лише сума до сплати і стан. Депозит, фінальна
// ціна, чек і refunds — адмінська картка оплати, сервер їх тут не віддає.
export interface BarberOnsiteStatus {
  bookingId: string;
  amountDue: number;
  paymentStatus: string;
}

export interface BarberOnsitePayment {
  bookingId: string;
  outcome: 'captured' | 'already_paid' | 'complimentary' | 'nothing_due' | 'failed';
  paidAmount: number;
  failureReason: string | null;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers ?? {}),
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Статус оплати візиту барбера: решта, форма, чек. */
export function getBarberOnsiteStatus(bookingId: string): Promise<BarberOnsiteStatus> {
  return fetchJson<BarberOnsiteStatus>(
    `/barber/payments/bookings/${encodeURIComponent(bookingId)}/onsite`
  );
}

/** Позначити решту оплаченою (готівка або POS) для власного запису барбера. */
export function payBarberOnsite(
  bookingId: string,
  form: BarberOnsiteForm
): Promise<BarberOnsitePayment> {
  return fetchJson<BarberOnsitePayment>('/barber/payments/onsite', {
    method: 'POST',
    body: JSON.stringify({ bookingId, form }),
  });
}
