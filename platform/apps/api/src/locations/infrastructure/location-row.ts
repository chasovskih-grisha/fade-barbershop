import { Address } from '../domain/address';
import { Location } from '../domain/location';
import { OpeningHours, type DayHours } from '../domain/opening-hours';
import { Chair } from '../domain/chair';
import { normalizeChannels } from '../domain/location-channel';
import { normalizePhotos } from '../domain/location-photo';

export interface LocationRow {
  id: string;
  code: string;
  name: string;
  address: string;
  street?: string | null;
  building?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: Date;
  chairs: { number: number; name: string | null; active: boolean }[];
  hours: { dayOfWeek: number; open: string | null; close: string | null; closed: boolean }[];
  channels: { channel: string; value: string; sortOrder: number }[];
  photos: { url: string; caption: string | null; sortOrder: number }[];
}

export function hydrateLocation(row: LocationRow): Location {
  return Location.reconstitute({
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address,
    addressParts: addressParts(row),
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    email: row.email,
    active: row.active,
    createdAt: row.createdAt,
    chairs: row.chairs.map((c) => Chair.of(c.number, c.name, c.active)),
    channels: normalizeChannels(row.channels),
    photos: normalizePhotos(row.photos),
    hours: OpeningHours.of(
      row.hours.map<DayHours>((h) => ({
        dayOfWeek: h.dayOfWeek,
        open: h.open,
        close: h.close,
        closed: h.closed,
      }))
    ),
  });
}

export function addressPartsFromRow(row: LocationRow): Address | null {
  if (!row.street || !row.building || !row.city) return null;
  return Address.of({
    street: row.street,
    building: row.building,
    city: row.city,
    ...(row.postalCode ? { postalCode: row.postalCode } : {}),
    ...(row.country ? { country: row.country } : {}),
  });
}

function addressParts(row: LocationRow): Address | null {
  return addressPartsFromRow(row);
}

export function locationPersistPayload(location: Location) {
  const parts = location.addressParts;
  return {
    name: location.name,
    address: location.address,
    street: parts?.street ?? null,
    building: parts?.building ?? null,
    city: parts?.city ?? null,
    postalCode: parts?.postalCode ?? null,
    country: parts?.country ?? null,
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
    email: location.email,
    active: location.active,
  };
}
