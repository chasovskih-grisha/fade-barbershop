import type { NextRequest } from 'next/server';
import { z } from 'zod';

// T-4725b: спільні частини маршруту звичного місця — заголовки сесії, читання
// довідників і розбір тіла. Самі GET/PATCH лишаються в route.ts.

export const API_BASE =
  process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

export const choiceSchema = z.object({
  locationId: z.string().uuid().nullable(),
  barberId: z.string().uuid().nullable(),
});

export interface Choice {
  locationId: string | null;
  barberId: string | null;
}

export interface Option {
  id: string;
  name: string;
}

/** Проксіюємо ту саму сесію, з якою прийшов браузер: bearer або cookie. */
export function authHeaders(request: NextRequest): Record<string, string> | null {
  const auth = request.headers.get('Authorization');
  const cookie = request.headers.get('Cookie');
  if (!auth && !cookie) return null;
  return {
    ...(auth ? { Authorization: auth } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

export async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  return (await res.json().catch(() => null)) as Record<string, unknown> | null;
}

/** Список з API: порожній/помилковий — порожній довідник, а не 500. */
export async function loadOptions(path: string): Promise<Option[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await readJson(res);
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => {
        const row = item as { id?: unknown; name?: unknown };
        return { id: String(row.id ?? ''), name: String(row.name ?? '') };
      })
      .filter((option) => option.id !== '');
  } catch {
    return [];
  }
}

/** Збережена пара з профілю; відсутнє поле — порожнє, а не вигадане. */
export function choiceOf(profile: Record<string, unknown> | null): Choice {
  const saved = (profile?.usualChair ?? {}) as Partial<Choice>;
  return { locationId: saved.locationId ?? null, barberId: saved.barberId ?? null };
}
