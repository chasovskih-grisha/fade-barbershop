// Дані послуг для публічної сторінки /services. Реальний API (ADR 0018) через
// спільний http-хелпер. Ціни живуть у ServicePrice за локацію — контракт
// GET /public/services/active?locationId=… (без локації ціни немає). Перша
// активна локація — спільний хелпер locations.ts. Типізовані стани (T-4513).
import { loadList, loadItem, fetchJson } from './http';
import { empty, failed, ok, type LoadableList, type LoadableItem } from './loadable';
import { getFirstActiveLocation } from './locations';
import type { BarberDto } from './staff';

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  coverImage?: string;
  description?: string;
}

/** Спільний вхід: активна локація + перехоплення ApiFailure → стан error. */
// prettier-ignore
async function withLocation<T>(fail: string, next: (locationId: string) => Promise<LoadableList<T>>): Promise<LoadableList<T>> {
  const location = await getFirstActiveLocation();
  if (location.state === 'error') return failed(fail);
  if (location.state !== 'ok') return empty();
  try {
    return await next(location.data.id);
  } catch {
    return failed(fail);
  }
}

export async function getServices(): Promise<LoadableList<Service>> {
  return withLocation(
    'Каталог послуг недоступний. Спробуйте за кілька хвилин.',
    async (locationId) => {
      // Ендпоінт повертає лише активні послуги з ціною, відсортовані за sortOrder.
      const result = await loadList<Service>(
        `/public/services/active?locationId=${encodeURIComponent(locationId)}`
      );
      return result.state === 'ok'
        ? result
        : result.state === 'empty'
          ? empty()
          : failed('Каталог послуг недоступний. Спробуйте за кілька хвилин.');
    }
  );
}

export async function getServiceById(id: string): Promise<LoadableItem<Service>> {
  const result = await loadItem<Service>(`/public/services/${encodeURIComponent(id)}`);
  if (result.state === 'notFound' || result.state === 'error') return result;
  return { state: 'ok', data: result.data };
}

export async function getBarbersForService(
  // Фільтр за послугою запровадить матриця «барбер × послуга» (T-4521);
  // поки ендпоінт повертає барберів локації без фільтра.
  _serviceId: string
): Promise<LoadableList<{ id: string; name: string; slug: string }>> {
  return withLocation(
    'Не вдалося завантажити барберів. Спробуйте за кілька хвилин.',
    async (locationId) => {
      const barbersDto = await fetchJson<BarberDto[]>({
        path: `/booking/barbers/${encodeURIComponent(locationId)}`,
      });
      if (barbersDto === null)
        return failed('Не вдалося завантажити барберів. Спробуйте за кілька хвилин.');
      // «Будь-який барбер» (any) — не майстер: фільтруємо і мапимо на slug.
      const barbers = barbersDto
        .filter((b) => !b.any && b.id)
        .map((b) => ({ id: b.id, name: b.name, slug: b.id.toLowerCase() }));
      return barbers.length === 0 ? empty() : ok(barbers);
    }
  );
}

export async function getSlotsForService(
  serviceId: string,
  date: string
): Promise<LoadableList<{ start: string; end: string; barbers: string[] }>> {
  return withLocation(
    'Не вдалося завантажити слоти. Спробуйте за кілька хвилин.',
    async (locationId) => {
      const slots = await fetchJson<{ start: string; end: string; barbers: string[] }[]>({
        path: '/booking/slots',
        method: 'POST',
        body: { locationId, date, serviceId },
      });
      if (slots === null)
        return failed('Не вдалося завантажити слоти. Спробуйте за кілька хвилин.');
      return ok(slots);
    }
  );
}
