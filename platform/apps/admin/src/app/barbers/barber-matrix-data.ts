// Матриця «барбер × послуга» (T-4521): дані та синхронізація. API
// /admin/barber-service; порожні рядки = «робить усі послуги» (fallback),
// тож перше зняття чекбокса матеріалізує рядки решти послуг.

import {
  categoriesOf,
  toMatrixService,
  UNCATEGORIZED,
  type MatrixService,
} from './barber-matrix-categories';

const IO = '/admin/barber-service';

type CatalogEntry = { id: string; name: string; category?: string; active?: boolean; prices?: CatalogPrice[] };

type CatalogPrice = { locationId: string; active?: boolean };
export { categoriesOf, UNCATEGORIZED };
export type { MatrixService } from './barber-matrix-categories';

/** Активні послуги, що мають ціну на цій локації (каталог локації). */
export async function locationServices(locationId: string): Promise<MatrixService[]> {
  const response = await fetch('/admin/services', { credentials: 'include' });
  if (!response.ok) throw new Error('Не вдалося завантажити послуги');
  const services = (await response.json()) as CatalogEntry[];
  return services
    .filter((service) => service.active !== false)
    .filter((service) =>
      service.prices?.some((price) => price.locationId === locationId && price.active !== false)
    )
    .map(toMatrixService);
}

/** Сет активних рядків матриці барбера на локації; порожній — «усі послуги». */
export async function assignedServiceIds(
  barberId: string,
  locationId: string
): Promise<Set<string>> {
  const response = await fetch(`${IO}/barbers/${barberId}/locations/${locationId}/services`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Не вдалося завантажити матрицю');
  const data = (await response.json()) as { services: { serviceId: string }[] };
  return new Set(data.services.map((item) => item.serviceId));
}

function call(url: string, method: string, body?: object): Promise<void> {
  return fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then((response) => {
    if (!response.ok) throw new Error('Не вдалося оновити матрицю');
  });
}

/** Перемикання чекбокса: повертає новий активний сет рядків. */
export async function toggleService(input: {
  barberId: string;
  locationId: string;
  serviceId: string;
  services: MatrixService[];
  assigned: Set<string>;
  makeIt: boolean;
}): Promise<Set<string>> {
  const { barberId, locationId, serviceId, services, assigned, makeIt } = input;
  const base = `${IO}/assignments/${barberId}/${locationId}`;
  if (assigned.size > 0) {
    if (makeIt && !assigned.has(serviceId)) {
      await call(`${IO}/assignments`, 'POST', { barberId, locationId, serviceId });
      assigned.add(serviceId);
    } else if (!makeIt && assigned.has(serviceId)) {
      await call(`${base}/${serviceId}/deactivate`, 'PATCH');
      assigned.delete(serviceId);
    }
    return new Set(assigned);
  }
  if (makeIt) return assigned; // режим «усі»: рядків немає, зняття не було
  // Режим «усі» → знімаємо перший чекбос: створюємо рядки решти послуг.
  const next = new Set<string>();
  for (const service of services) {
    if (service.id === serviceId) continue;
    await call(`${IO}/assignments`, 'POST', { barberId, locationId, serviceId: service.id });
    next.add(service.id);
  }
  return next;
}

/**
 * Режим «за категоріями» (T-4521b): матриця = усі послуги обраних категорій.
 * Повертає новий активний сет; порожній сет означає «усі» лише тоді, коли
 * обрано всі категорії — інакше рядки решти послуг матеріалізуються.
 */
export async function applyCategories(input: {
  barberId: string;
  locationId: string;
  services: MatrixService[];
  assigned: Set<string>;
  categories: string[];
}): Promise<Set<string>> {
  const { barberId, locationId, services, assigned, categories } = input;
  const chosen = new Set(categories);
  const target = new Set(
    categoriesOf(services)
      .filter((group) => chosen.has(group.name))
      .flatMap((group) => group.serviceIds)
  );
  const current = assigned.size > 0 ? new Set(assigned) : new Set(services.map((s) => s.id));
  const base = `${IO}/assignments/${barberId}/${locationId}`;
  for (const service of services) {
    const want = target.has(service.id);
    if (want && !current.has(service.id)) {
      await call(`${IO}/assignments`, 'POST', { barberId, locationId, serviceId: service.id });
    } else if (!want && current.has(service.id)) {
      await call(`${base}/${service.id}/deactivate`, 'PATCH');
    }
  }
  return target;
}
