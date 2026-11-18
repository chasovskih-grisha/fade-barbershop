// Дані локацій для публічних сторінок (/locations, /locations/{code}).
// Виклик **реального API** (ADR 0018: моноліт на :13000) через спільний
// http-хелпер: SSR не бачить next-rewrites, тому береться абсолютний URL.
// Контракт відповіді — той самий, що віддає admin-мапер (toLocationDto):
// code/lat/lng/email + hours/chairs/channels/photos.
// Клієнт повертає типізовані стани (T-4513), а не «[] або null»: помилка API
// і порожня відповідь — різні екрани. Активні локації фільтруються на
// сервері (MNG-ADM-02: вимкнена зникає зі списку негайно), а за прямим URL
// вимкнена приходить з active=false — сторінка показує явний стан, а не 404.

import { loadItem, loadList } from './http';
import { empty, failed, notFound, ok, type LoadableItem, type LoadableList } from './loadable';

export interface OpeningHour {
  dayOfWeek: number;
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface Chair {
  number: number;
  name: string | null;
  active: boolean;
}

/** Канал зв'язку локації (детальна сторінка, web-screens §2). */
export interface Channel {
  channel:
    'phone' | 'email' | 'viber' | 'telegram' | 'instagram' | 'facebook' | 'whatsapp' | 'website';
  value: string;
  sortOrder: number;
}

/** Фото галереї локації (web-screens §2). */
export interface Photo {
  url: string;
  caption: string | null;
  sortOrder: number;
}

/** Логотип локації (T-4609): публічні URL з бакета `location-brand`.
 * `darkUrl` — варіант для темної теми; `null` — лише світлий файл. */
export interface LocationLogo {
  variant: 'mark' | 'lockup';
  lightUrl: string;
  darkUrl: string | null;
  alt: string;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  active: boolean;
  hours: OpeningHour[];
  chairs: Chair[];
  channels: Channel[];
  photos: Photo[];
  logo: LocationLogo | null;
}

/** Активні локації: ok зі списком / empty / error. 404 на списку — це
 * «API не той», а не «локацій немає»: показуємо помилку, а не порожній каталог. */
export async function getLocations(): Promise<LoadableList<Location>> {
  const result = await loadList<Location>('/locations');
  if (result.state === 'empty') return empty();
  if (result.state !== 'ok')
    return failed('Каталог локацій недоступний. Спробуйте за кілька хвилин.');
  const active = result.data.filter((loc) => loc.active);
  return active.length === 0 ? empty() : ok(active);
}

/** Локація за кодом: ok (можливо active=false) / notFound / error. */
export async function getLocationByCode(code: string): Promise<LoadableItem<Location>> {
  return loadItem<Location>(`/locations/${encodeURIComponent(code)}`);
}

/** Перша активна локація — для ендпоінтів, що приймають locationId (booking/*).
 * Публічні /barbers і /services самі локацію не вибирають, тож береться перша
 * активна. ok(локація) / notFound (локацій немає) / error (API недоступний). */
export async function getFirstActiveLocation(): Promise<LoadableItem<Location>> {
  const result = await getLocations();
  if (result.state === 'ok' && result.data[0]) return ok(result.data[0]);
  if (result.state === 'error') return failed(result.message);
  return notFound();
}
