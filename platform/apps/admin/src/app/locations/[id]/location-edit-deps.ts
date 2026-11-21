import type { ToastTone } from '@fade/ui';
import type { DayHours } from '../HoursEditor';
import type { LocationDto } from './location-edit-types';

export interface Deps {
  location: LocationDto | null;
  hours: DayHours[];
  setSaving: (value: boolean) => void;
  setError: (value: string | null) => void;
  setNotice: (notice: { text: string; tone: ToastTone } | null) => void;
  setLocation: (location: LocationDto) => void;
}

export function patchLocation(id: string, body: unknown): Promise<Response> {
  return fetch(`/admin/locations/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}
