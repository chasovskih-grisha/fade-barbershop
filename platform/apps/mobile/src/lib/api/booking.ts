import {
  depositHoldToPayment,
  type ConfirmedBooking,
  type DepositHoldStatus,
  type DepositPayment,
} from '@fade/contracts';
import { apiBase } from './api-base';

/** T-071: реальний клієнтський флоу запису замість локально згенерованих слотів. */
export interface BookingServiceDto {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface BookingSlotDto {
  start: string;
  end: string;
  barbers: string[];
}

export type CreatedBooking = ConfirmedBooking;
export type { DepositPayment };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { credentials: 'include', ...init });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchBookingServices(locationId: string): Promise<BookingServiceDto[]> {
  return request(`/booking/services/${encodeURIComponent(locationId)}`);
}

export function fetchBookingSlots(input: {
  locationId: string;
  date: string;
  serviceId: string;
  barberId?: string;
}): Promise<BookingSlotDto[]> {
  return request('/booking/slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function createBooking(input: {
  locationId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  barberId: string;
}): Promise<CreatedBooking> {
  return request('/booking/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** Платіжна мутація без автоматичного повтору: повтор може списати двічі. */
export function payBookingDeposit(bookingId: string, requestKey?: string): Promise<DepositPayment> {
  return request(`/payment/bookings/${encodeURIComponent(bookingId)}/deposit`, {
    method: 'POST',
    ...(requestKey ? { headers: { 'Idempotency-Key': requestKey } } : {}),
  });
}

/** Read-only reconciliation after an unknown POST result. */
export async function fetchDepositStatus(
  bookingId: string,
  resumeToken?: string
): Promise<DepositPayment> {
  const status = await request<DepositHoldStatus>(
    `/payment/bookings/${encodeURIComponent(bookingId)}/deposit`,
    resumeToken ? { headers: { 'x-deposit-resume-token': resumeToken } } : undefined
  );
  return depositHoldToPayment(bookingId, status);
}

export function todayInKyiv(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(now);
}
