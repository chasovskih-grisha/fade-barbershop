// Дані барберів для публічних сторінок (/barbers, /barbers/{slug}) через
// GET /booking/barbers/:locationId. Типізовані стани (T-4513): ok / empty /
// error. Довідник питає кожну активну студію (T-4852a).

import { loadList } from './http';
import { empty, failed, ok, type LoadableList, type LoadableItem } from './loadable';
import { getFirstActiveLocation } from './locations';
import { getBarberAcrossStudios } from './studio-directory';
import { listedBarbers, mapBarber } from './barber-visibility';

/** Студія людини: код для посилання, назва для тексту (T-4861a). */
export interface StudioRef {
  code: string;
  name: string;
}

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
  portfolioThumbUrl?: string | null;
  /** Студії, де ця людина працює (T-4852a): назви й коди з локацій. */
  studios?: StudioRef[];
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
  active?: boolean;
  photo?: BarberPhotoDto | null;
}

async function loadBarbers(): Promise<LoadableList<Barber>> {
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
  const barbers = result.data.filter((b) => !b.any && b.id).map(mapBarber);

  return barbers.length === 0 ? empty() : ok(barbers);
}

/** Довідник: лише ті, хто ще приймає запис (T-4865a). */
export async function getBarbers(): Promise<LoadableList<Barber>> {
  const result = await loadBarbers();
  if (result.state !== 'ok') return result;

  const listed = listedBarbers(result.data);
  return listed.length === 0 ? empty() : ok(listed);
}

export async function getBarberBySlug(slug: string): Promise<LoadableItem<Barber>> {
  // Профіль шукає людину по всіх студіях (T-4861a), а не лише по першій, і
  // розрішає вимкненого майстра: сторінка сама пояснює, чому запис недоступний.
  return getBarberAcrossStudios(slug);
}
