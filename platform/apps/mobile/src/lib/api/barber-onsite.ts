import { apiBase } from './api-base';

export type BarberOnsiteForm = 'cash' | 'pos';

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

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

export function getBarberOnsiteStatus(
  bookingId: string,
  accessToken: string
): Promise<BarberOnsiteStatus> {
  return request(`/barber/payments/bookings/${encodeURIComponent(bookingId)}/onsite`, accessToken);
}

export function payBarberOnsite(
  bookingId: string,
  form: BarberOnsiteForm,
  accessToken: string
): Promise<BarberOnsitePayment> {
  return request('/barber/payments/onsite', accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, form }),
  });
}
