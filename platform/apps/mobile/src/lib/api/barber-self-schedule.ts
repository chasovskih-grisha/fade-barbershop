// T-4616b: клієнт self-service графіка барбера. Маршрути захищені
// ClientSessionGuard, який приймає Bearer mobile-сесії, тож токен передаємо
// заголовком (як `barber-onsite`), а барбера визначає сервер.
import { apiBase } from './api-base';

export interface BarberScheduleLocation {
  id: string;
  name: string;
}

export interface BarberScheduleLocations {
  barberId: string;
  locations: BarberScheduleLocation[];
}

export interface BarberScheduleView {
  barberId: string;
  locationId: string;
  windows: Array<{ dayOfWeek: number; start: string; end: string }>;
  version: number;
  /** SCH-001: без права адміна барбер лише дивиться (SCH-BAR-03). */
  canEdit: boolean;
  history: unknown[];
}

export interface UnavailabilityInterval {
  start: string;
  end: string;
  reason?: string;
}

export interface MarkUnavailableResult {
  conflictsCreated: number;
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

/** Локації барбера — екран не має вгадувати `locationId`. */
export function getBarberScheduleLocations(accessToken: string): Promise<BarberScheduleLocations> {
  return request('/barber/schedule', accessToken);
}

export function getBarberSchedule(
  locationId: string,
  accessToken: string
): Promise<BarberScheduleView> {
  return request(`/barber/schedule/${encodeURIComponent(locationId)}`, accessToken);
}

/** Позначка «не вийду»: та сама команда, що йде з адмінки (T-4616a). */
export function markBarberUnavailable(
  locationId: string,
  interval: UnavailabilityInterval,
  accessToken: string
): Promise<MarkUnavailableResult> {
  return request(`/barber/schedule/${encodeURIComponent(locationId)}/unavailability`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start: interval.start,
      end: interval.end,
      ...(interval.reason ? { reason: interval.reason } : {}),
    }),
  });
}
