import { apiBase } from './api-base';

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
  locationName?: string | undefined;
  /** Спеціалізації прийдуть із профілю (T-4477a). Поки endpoint їх не шле,
   * поле необовʼязкове й картка не домальовує чипи з нічого. */
  specialties?: string[] | undefined;
  /** Досвід — так само з профілю (T-4477a); без нього картка не вигадує роки. */
  experience?: string | undefined;
  /** Вимкнений майстер лишається в payload, щоб прямий лінк міг пояснити (T-4865b). */
  active?: boolean | undefined;
}

/** T-4869: список приходить із мережі, тож клієнт читає його один раз тут:
 * без id чи імені запис не стає людиною, а фото без адреси — не фото. */
function toBarber(raw: unknown): BarberDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<BarberDto>;
  if (typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name) return null;
  const photo = item.photo && typeof item.photo.url === 'string' && item.photo.url.trim() ? item.photo : null;
  return { ...item, photo } as BarberDto;
}

export async function fetchBarbers(locationId: string): Promise<BarberDto[]> {
  const res = await fetch(`${apiBase()}/booking/barbers/${encodeURIComponent(locationId)}`);
  if (!res.ok) throw new Error('Failed to fetch barbers');
  const json = await res.json();
  const list = Array.isArray(json) ? json : (json.data ?? []);
  return list
    .map(toBarber)
    .filter((barber: BarberDto | null): barber is BarberDto => barber !== null && !barber.any);
}

/** Довідник показує лише тих, хто ще приймає запис; відсутній прапорець
 * означає «показувати» — старший payload не має ховати людей (T-4865b). */
export function listedBarbers(barbers: BarberDto[]): BarberDto[] {
  return barbers.filter((barber) => barber.active !== false);
}

export async function fetchBarberById(locationId: string, id: string): Promise<BarberDto | null> {
  const barbers = await fetchBarbers(locationId);
  const found = barbers.find((b) => b.id === id || b.id.toLowerCase() === id.toLowerCase());
  return found || null;
}
