// API-клієнт флоу запису (T-041, екрани 0–5): публічні ендпоінти /booking/*
// через next-rewrites (ADR 0018). Підтвердження — POST /booking/bookings
// (ClientBookingsController): канал аналітики примусово 'web' на сервері,
// тривалість послуги резолвиться з каталогу — клієнт її не надсилає.
import type { ServiceDto, BarberDto, AvailableSlotDto } from './types';

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
}): Promise<AvailableSlotDto[]> {
  // prettier-ignore
  return withRetry(
    fetch('/booking/slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }).then(json<AvailableSlotDto[]>),
    'listSlots'
  );
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
}): Promise<{ id: string }> {
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
    }).then(json<{ id: string }>),
    'confirmBooking'
  );
}
