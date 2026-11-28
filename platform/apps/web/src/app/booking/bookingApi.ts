// API-клієнт флоу запису (T-041, екрани 0–5): публічні ендпоінти /booking/*
// через next-rewrites (ADR 0018). Підтвердження — POST /booking/bookings
// (ClientBookingsController): канал аналітики примусово 'web' на сервері,
// тривалість послуги резолвиться з каталогу — клієнт її не надсилає.
/* eslint-disable max-lines -- public booking API stays in one client module; split tracked in T-2500f */
import {
  depositHoldToPayment,
  isDepositHoldStatus,
  type DepositHoldStatus,
  type DepositPayment,
} from '@fade/contracts';
import type { ServiceDto, BarberDto, AvailableSlotDto } from './types';
import type { ConfirmedBooking } from './deposit-types';
export type { DepositHoldStatus } from '@fade/contracts';

export type { ConfirmedBooking, DepositPayment } from './deposit-types';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as T;
}

export function listServices(locationId: string): Promise<ServiceDto[]> {
  return withRetry(
    fetch(`/booking/services/${locationId}`).then(json<ServiceDto[]>),
    'listServices'
  );
}

/** Крок 2 (T-4521): `serviceId` лишає барберів, що виконують обрану послугу. */
export function listBarbers(locationId: string, serviceId?: string): Promise<BarberDto[]> {
  const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : '';
  return withRetry(
    fetch(`/booking/barbers/${locationId}${query}`).then(json<BarberDto[]>),
    'listBarbers'
  );
}

/** Змінна для ліміту повторних спроб */
const RETRY_LIMIT = 3;

/** Повторна спроба API запиту з exponential backoff (2s, 4s, 8s) */
async function withRetry<T>(promise: Promise<T>, _operation: string): Promise<T> {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return promise;
  }
  let lastError: any;
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    try {
      return await promise;
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_LIMIT) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/** Вільні слоти на дату: barbers: [] — слот зайнятий (disabled у стрічці). */
export function listSlots(input: {
  locationId: string;
  date: string;
  serviceId: string;
  barberId?: string;
  /** T-4521c: parallel-пакет рахує сітку за `parallelDuration` послуги. */
  fulfillmentMode?: 'sequential' | 'parallel';
}): Promise<AvailableSlotDto[]> {
  // prettier-ignore
  return withRetry(
    fetch('/booking/slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }).then(json<AvailableSlotDto[]>),
    'listSlots'
  );
}

/** T-4619b: списання без ретраю; `requestKey` стабільний для спроби. */
export function payDeposit(bookingId: string, requestKey?: string): Promise<DepositPayment> {
  return fetch(`/payment/bookings/${bookingId}/deposit`, {
    method: 'POST',
    ...(requestKey ? { headers: { 'Idempotency-Key': requestKey } } : {}),
  }).then(json<DepositPayment>);
}

export function getDepositStatus(
  bookingId: string,
  resumeToken?: string
): Promise<DepositHoldStatus> {
  return fetch(`/payment/bookings/${bookingId}/deposit`, {
    cache: 'no-store',
    ...(resumeToken ? { headers: { 'x-deposit-resume-token': resumeToken } } : {}),
  }).then((response) => {
    if (!response.ok) throw new Error(`API error ${response.status}`);
    return response.json() as Promise<DepositHoldStatus>;
  });
}

/** Лише читання: звіряє невідомий результат без повторної мутації. */
export async function fetchDepositStatus(
  bookingId: string,
  resumeToken?: string
): Promise<DepositPayment> {
  const status = await getDepositStatus(bookingId, resumeToken);
  if (!isDepositHoldStatus(status)) throw new Error('Invalid deposit status response');
  return depositHoldToPayment(bookingId, status);
}

/** Екран 5 (T-041): підтвердження — той самий use case, що й адмінка. */
export function confirmBooking(input: {
  locationId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  barberId?: string;
  fulfillmentMode?: 'sequential' | 'parallel';
  clientId?: string;
  comment?: string;
  haircutReferenceId?: string;
}): Promise<ConfirmedBooking> {
  // prettier-ignore
  const body = {
    ...input,
    reference: {
      ...(input.comment ? { appointmentComment: input.comment } : {}),
      ...(input.haircutReferenceId ? { haircutReferenceId: input.haircutReferenceId } : {}),
    },
  };
  return withRetry(
    fetch('/booking/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(json<ConfirmedBooking>),
    'confirmBooking'
  );
}
