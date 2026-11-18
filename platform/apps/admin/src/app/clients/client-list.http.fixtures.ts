// HTTP-моки для сторінкових спек списку клієнтів (T-4606a/T-4606b): один
// роутер fetch на сценарії «успіх / 500 / вічне завантаження» + журнал
// запитів. Тести лишаються про стан сторінки, а не про форму відповіді;
// дві спеки (page.test / page.states.test) ділять цей файл замість копії.
import type { ClientListResult } from './client-list-types';

/** Довідник локацій: імʼя для фільтра й назв у підсумках. */
const LOCATIONS = [{ id: 'loc-1', name: 'Поділ' }];

export interface FetchLog {
  calls: string[];
  /** Запити саме списку клієнтів — retry перевіряємо за ними. */
  clientCalls: () => string[];
}

/** Один роутер: /admin/locations — довідник, решта (список) — за сценарієм. */
function install(route: (url: string) => unknown): FetchLog {
  const calls: string[] = [];
  global.fetch = jest.fn((input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.startsWith('/admin/locations')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => LOCATIONS });
    }
    return Promise.resolve(route(url));
  }) as typeof fetch;
  return { calls, clientCalls: () => calls.filter((url) => url.startsWith('/admin/clients')) };
}

/** Список відповідає 200 із переданою сторінкою. */
export const installClientListFetch = (result: ClientListResult): FetchLog =>
  install(() => ({ ok: true, status: 200, json: async () => result }));

/** Список віддає 500: сторінка має показати банер і дозволити повтор. */
export const installFailingClientListFetch = (): FetchLog =>
  install(() => ({ ok: false, status: 500 }));

/** Запит ніколи не завершується — перевіряємо Skeleton, а не порожній список. */
export const installPendingClientListFetch = (): FetchLog =>
  install(() => new Promise<never>(() => {}));
