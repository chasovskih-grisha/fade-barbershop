import { apiBase } from './api-base';
import type {
  AppointmentResponse,
  BookAgainIntent,
  ExtendedAppointment,
} from './appointment-types';

export type { CabinetStatus, ExtendedAppointment } from './appointment-types';
export type { BookAgainIntent, BookAgainRef } from './appointment-types';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { credentials: 'include' });
  // 404 тут — не «порожній кабінет», а відсутній маршрут: раніше він
  // перетворювався на [], і екран мовчазив «у вас немає візитів».
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'API error' }));
    throw new Error(err.message || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getAppointments(): Promise<ExtendedAppointment[]> {
  const result = await fetchJson<AppointmentResponse[]>('/booking/appointments');
  return result.map((app) => ({
    id: app.id,
    date: app.date,
    startTime: app.startTime,
    endTime: app.endTime ?? '',
    serviceName: app.serviceName,
    barberName: app.barberName,
    locationName: app.locationName,
    price: app.price,
    status: app.status,
    referenceId: app.referenceId ?? null,
    referenceComment: app.referenceComment ?? '',
    // Сервер вирішує право редагування; відсутнє поле трактуємо як «ні».
    canEditReference: app.canEditReference ?? false,
    // Відсутнє поле — старий API без правила партії: дію не ховаємо.
    canBookAgain: app.canBookAgain ?? true,
    // Депозит — снепшот умов на візиті; немає його — грошового наслідку
    // скасування немає (T-4737).
    deposit: app.deposit
      ? { amount: app.deposit.amount ?? 0, freeCancelUntil: app.deposit.freeCancelUntil ?? null }
      : null,
  }));
}

async function postCommand(path: string, body?: unknown): Promise<void> {
  // exactOptionalPropertyTypes: тіло/заголовок передається лише коли є що передати.
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    credentials: 'include',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (res.ok) return;
  const err = (await res.json().catch(() => ({}))) as { message?: string };
  throw new Error(err.message || `API ${res.status}`);
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
 * Редагування референсу/коментаря з «Моїх візитів» (T-043, REF-WEB-04).
 * Поля необов'язкові: undefined — не чіпати, '' — прибрати значення.
 * Сервер тримає замок після підтвердження барбером → 409.
 */
export function setAppointmentReference(
  appointmentId: string,
  reference: { referenceId?: string; comment?: string }
): Promise<void> {
  return postCommand(`/appointments/${appointmentId}/reference`, reference);
}

/**
 * Намір повторного запису із завершеного візиту (T-4617a/b): локація, послуга,
 * барбер і поточна ціна. Нічого не створює — лише підказує, що підставити
 * у флоу, і яке з полів уже нечинне.
 */
export function getBookAgainIntent(appointmentId: string): Promise<BookAgainIntent> {
  return fetchJson<BookAgainIntent>(`/appointments/${appointmentId}/book-again`);
}
