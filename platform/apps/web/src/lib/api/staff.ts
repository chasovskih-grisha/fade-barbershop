// Дані барберів для публічних сторінок (/barbers, /barbers/{slug}).
// Виклик реального API через booking controller: GET /booking/barbers/:locationId.
// Ендпоінт приймає саме locationId (не код локації!), тому спочатку береться
// перша активна локація. Повертає типізовані стани (T-4513): ok / empty / error.

import { loadList } from './http';
import { empty, failed, ok, notFound, type LoadableList, type LoadableItem } from './loadable';
import { getFirstActiveLocation } from './locations';

export interface Barber {
  id: string;
  userId: string;
  slug: string;
  name: string;
  role: string;
  active: boolean;
  photoUrl: string | null;
  experience?: string;
  specialties?: string[];
  bio?: string;
}

export interface BarberPhotoDto {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface BarberDto {
  id: string;
  name: string;
  any?: boolean;
  photo?: BarberPhotoDto | null;
}

export async function getBarbers(): Promise<LoadableList<Barber>> {
  const location = await getFirstActiveLocation();
  if (location.state === 'error') return failed('Команда недоступна. Спробуйте за кілька хвилин.');
  if (location.state !== 'ok') return empty();

  const result = await loadList<BarberDto>(
    `/booking/barbers/${encodeURIComponent(location.data.id)}`
  );
  if (result.state === 'empty') return empty();
  if (result.state !== 'ok') return failed('Команда недоступна. Спробуйте за кілька хвилин.');

  // Filter out "Any barber" option and map to the public Barber shape.
  // Профіль (біографія, досвід, спеціалізації) тут не вигадується: поки API не
  // віддає ці поля, картка й сторінка показують лише правду — ім'я та фото.
  const barbers = result.data
    .filter((b) => !b.any && b.id)
    .map((b) => ({
      id: b.id,
      userId: b.id,
      slug: b.id.toLowerCase(),
      name: b.name,
      role: 'Майстер-барбер',
      active: true,
      photoUrl: b.photo?.url ?? null,
    }));

  return barbers.length === 0 ? empty() : ok(barbers);
}

export async function getBarberBySlug(slug: string): Promise<LoadableItem<Barber>> {
  const barbersResult = await getBarbers();
  if (barbersResult.state !== 'ok') {
    return barbersResult.state === 'error' ? failed(barbersResult.message) : notFound();
  }

  const barber = barbersResult.data.find((b) => b.slug === slug || b.id === slug);
  return barber ? ok(barber) : notFound();
}
