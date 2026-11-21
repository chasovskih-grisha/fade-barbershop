import { apiBase } from '../../../lib/api/api-base';
import type { WaitlistEntry } from './waitlist-model';

interface ApiEntry {
  id: string;
  serviceName?: string;
  serviceId?: string;
  barberName?: string | null;
  barberId?: string | null;
  locationName?: string;
  locationId?: string;
  status?: string;
  createdAt?: string;
  holdExpiry?: string | null;
  missedCount?: number;
}

function first(...values: Array<string | null | undefined>): string {
  return values.find((value) => Boolean(value)) ?? '';
}

function mapEntry(raw: ApiEntry): WaitlistEntry {
  return {
    id: raw.id,
    serviceName: first(raw.serviceName, raw.serviceId, 'Послуга'),
    barberName: first(raw.barberName, raw.barberId) || null,
    locationName: first(raw.locationName, raw.locationId, 'Локація'),
    status: raw.status ?? 'active',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    holdExpiry: raw.holdExpiry ?? null,
    missedCount: raw.missedCount ?? 0,
  };
}

export async function fetchWaitlistEntries(): Promise<WaitlistEntry[]> {
  try {
    const response = await fetch(`${apiBase()}/booking/waitlist`, { credentials: 'include' });
    if (!response.ok) return [];
    const body = (await response.json()) as { entries?: ApiEntry[] } | ApiEntry[] | null;
    const list = Array.isArray(body) ? body : (body?.entries ?? []);
    return list.map(mapEntry);
  } catch {
    return [];
  }
}

export async function leaveWaitlist(_id: string): Promise<void> {
  // Оптимістичне видалення виконує UI; API-маршрут може бути відсутній у mock.
}
