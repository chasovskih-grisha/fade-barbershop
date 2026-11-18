// Матриця «барбер × послуга» (T-4521): дані та синхронізація. API
// /admin/barber-service; порожні рядки = «робить усі послуги» (fallback),
// тож перше зняття чекбокса матеріалізує рядки решти послуг.

const IO = '/admin/barber-service';

type CatalogPrice = { locationId: string; active?: boolean };
type CatalogEntry = {
  id: string;
  name: string;
  active?: boolean;
  prices?: CatalogPrice[];
};

export type MatrixService = { id: string; name: string };

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
    .map((service) => ({ id: service.id, name: service.name }));
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
