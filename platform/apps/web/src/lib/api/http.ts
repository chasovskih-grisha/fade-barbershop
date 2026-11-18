import { failed, notFound, okList, type LoadableItem, type LoadableList } from './loadable';

// SSR-клієнт API для публічних сторінок (T-4513). Один хелпер на всі ендпоінти:
// помилка/404/порожня відповідь більше не зливаються в «[]» або виняток — сторінка
// отримує типізований стан і рендерить його (EmptyState / AlertBanner + Retry).
// SSR не бачить next-rewrites, тому абсолютний API-URL (ADR 0018).

const DEFAULT_BASE = 'http://localhost:13000';
/** LOCATION_API_URL — історична змінна web (locations.ts, e2e/seed-integrity);
 * WEB_API_URL/API_ORIGIN — загальні для всіх публічних ендпоінтів. */
const apiBase = (): string =>
  process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? process.env.LOCATION_API_URL ?? DEFAULT_BASE;

export interface FetchJsonOptions {
  /** Публічний шлях API, наприклад '/locations'. */
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** ISR: кеш сторінки у секундах (блог). Без нього — `no-store`, свіжий стан. */
  revalidate?: number | undefined;
  /** Request timeout in milliseconds (default: 10000ms) */
  timeoutMs?: number;
}

/** Сирий JSON із сервера: `null` на 404, кидає на інших помилках (обгортка нижче). */
export async function fetchJson<T>({
  path,
  method = 'GET',
  body,
  headers,
  signal,
  revalidate,
  timeoutMs = 10000,
}: FetchJsonOptions): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const res = await fetch(`${apiBase()}${path}`, {
      method,
      // Або ISR-кеш (блог, T-4513), або свіжий стан — операційні екрани
      // (локації, ціни) не мають віддавати застаріле.
      ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' as const }),
      headers: { 'content-type': 'application/json', ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiFailure(res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Помилка API з кодом статусу — щоб `loadList`/`loadItem` відрізнили 404 від 5xx. */
export class ApiFailure extends Error {
  constructor(readonly status: number) {
    super(`API ${status}`);
    this.name = 'ApiFailure';
  }
}

/** Список: ok / empty / error / notFound. */
export async function loadList<T>(path: string, revalidate?: number): Promise<LoadableList<T>> {
  try {
    const data = await fetchJson<T[]>({ path, revalidate });
    return data === null ? notFound() : okList(data);
  } catch (error) {
    return failed(describeFailure(error));
  }
}

/** Деталька: ok / notFound / error (стану «порожньо» в детальці не буває). */
export async function loadItem<T>(path: string, revalidate?: number): Promise<LoadableItem<T>> {
  try {
    const data = await fetchJson<T>({ path, revalidate });
    return data === null ? notFound() : { state: 'ok', data };
  } catch (error) {
    return failed(describeFailure(error));
  }
}

/** Тексти помилок — українською, без кальок з HTTP (admin/16-shared: 401 → login,
 * 403 → відмова, 404 → не знайдено, мережа → retry). */
function describeFailure(error: unknown): string {
  if (error instanceof ApiFailure) {
    if (error.status >= 500) return 'Сервіс недоступний. Спробуйте за кілька хвилин.';
    return 'Не вдалося завантажити дані. Спробуйте ще раз.';
  }
  return 'Не вдалося завантажити дані. Перевірте з’єднання.';
}
