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
}

export async function fetchBarbers(locationId: string): Promise<BarberDto[]> {
  const res = await fetch(`${apiBase()}/booking/barbers/${encodeURIComponent(locationId)}`);
  if (!res.ok) throw new Error('Failed to fetch barbers');
  const json = await res.json();
  const list = Array.isArray(json) ? json : (json.data ?? []);
  return list.filter((b: BarberDto) => !b.any);
}

export async function fetchBarberById(locationId: string, id: string): Promise<BarberDto | null> {
  const barbers = await fetchBarbers(locationId);
  const found = barbers.find((b) => b.id === id || b.id.toLowerCase() === id.toLowerCase());
  return found || null;
}
