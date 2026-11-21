import type { ExtendedAppointment } from '../booking-contract';
import { CABINET_STATUS } from '../booking-contract';
import { apiBase } from './api-base';

/** Сирі поля відповіді `GET /booking/appointments` (статус домену). */
interface RawAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  serviceName: string;
  barberName: string;
  locationName: string;
  price: number;
  status?: string | null;
  referenceId?: string | null;
  referenceComment?: string;
  canEditReference?: boolean;
  canBookAgain?: boolean;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { credentials: 'include' });
  // 404 тут — не «порожній кабінет», а відсутній маршрут.
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: 'API error' }))) as {
      message?: string;
    };
    throw new Error(err.message || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Той самий CABINET_STATUS, що й на сервері: доменний статус → статус
 * кабінету. Сервер уже конвертує, але клієнт застосовує словник і до
 * невідомих значень, щоб екран не показував сирий статус.
 */
function cabinetStatus(status: string | null | undefined): ExtendedAppointment['status'] {
  return CABINET_STATUS[status ?? ''] ?? 'cancelled';
}

export async function getAppointments(): Promise<ExtendedAppointment[]> {
  const result = await fetchJson<RawAppointment[]>('/booking/appointments');
  return result.map((app) => ({
    id: app.id,
    date: app.date,
    startTime: app.startTime,
    endTime: app.endTime ?? '',
    serviceName: app.serviceName,
    barberName: app.barberName,
    locationName: app.locationName,
    price: app.price,
    status: cabinetStatus(app.status),
    referenceId: app.referenceId ?? null,
    referenceComment: app.referenceComment ?? '',
    // Сервер вирішує право редагування; відсутнє поле трактуємо як «ні».
    canEditReference: app.canEditReference ?? false,
    // Правило партії (T-4617): відсутнє поле — старий API, дію не ховаємо.
    canBookAgain: app.canBookAgain ?? true,
  }));
}

/**
 * Помилка команди з HTTP-статусом: UI має відрізняти 409 (замок після
 * підтвердження барбером, REF-WEB-04) від мережевої помилки.
 */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function postCommand(path: string, body?: unknown): Promise<void> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    credentials: 'include',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (res.ok) return;
  const err = (await res.json().catch(() => ({}))) as { message?: string };
  throw new ApiError(err.message || `API ${res.status}`, res.status);
}

export function cancelAppointment(appointmentId: string): Promise<void> {
  return postCommand(`/appointments/${appointmentId}/cancel`);
}

export function rescheduleAppointment(
  appointmentId: string,
  when: { date: string; start: string; end: string }
): Promise<void> {
  return postCommand(`/appointments/${appointmentId}/reschedule`, when);
}

/**
 * Зміна референсу/коментаря з «Моїх візитів» (T-043, REF-MOB-02).
 * Поля необов'язкові: undefined — не чіпати, '' — прибрати значення.
 * Сервер тримає замок після підтвердження барбером → 409 (REF-WEB-04),
 * тож клієнтське правило і серверне збігаються.
 */
export function setAppointmentReference(
  appointmentId: string,
  reference: { referenceId?: string; comment?: string }
): Promise<void> {
  return postCommand(`/appointments/${appointmentId}/reference`, reference);
}
