import { apiBase } from './api-base';

// T-4850: мобільний тип повторює публічний DTO локації без перейменувань
// (`addressParts.city`, а не `city` на межі) — щоб екрани читали ті самі поля,
// що сайт. Нове поле додається лише тоді, коли воно є в DTO API.

export interface AddressPartsDto {
  street: string;
  building: string;
  city: string;
  postalCode?: string;
  country?: string;
}

export interface OpeningHourDto {
  dayOfWeek: number;
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface ChairDto {
  number: number;
  name: string | null;
  active: boolean;
}

export interface ChannelDto {
  channel: string;
  value: string;
  sortOrder: number;
}

export interface LocationPhotoDto {
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface LocationLogoDto {
  variant: 'mark' | 'lockup';
  lightUrl: string;
  darkUrl: string | null;
  alt: string;
}

export interface LocationDto {
  id: string;
  code: string;
  name: string;
  address: string;
  addressParts: AddressPartsDto | null;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  active: boolean;
  hours: OpeningHourDto[];
  chairs: ChairDto[];
  channels: ChannelDto[];
  photos: LocationPhotoDto[];
  logo: LocationLogoDto | null;
}

export async function fetchLocations(): Promise<LocationDto[]> {
  const res = await fetch(`${apiBase()}/locations`);
  if (!res.ok) throw new Error('Failed to fetch locations');
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

/** Одна студія за кодом: null — локації немає (404), помилка мережі/сервера —
 * throw, а не порожня студія. */
export async function fetchLocation(code: string): Promise<LocationDto | null> {
  const res = await fetch(`${apiBase()}/locations/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch location');
  return (await res.json()) as LocationDto;
}
