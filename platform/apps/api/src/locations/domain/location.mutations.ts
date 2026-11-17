import type { Address } from './address';
import { Coordinates } from './coordinates';
import { OpeningHours } from './opening-hours';
import { Chair, CHAIR_LIMIT } from './chair';
import type { ChannelData } from './location-channel';
import type { PhotoData } from './location-photo';
import { optionalTrimmed, optionalValue, type PatchValue } from './location.helpers';
import type { LocationData } from './location.types';

export function applyProfilePatch(
  data: LocationData,
  input: {
    name?: string | undefined;
    address?: string | undefined;
    addressParts?: Address | undefined;
    coordinates?: Coordinates | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
  }
): boolean {
  const record = data as unknown as Record<string, PatchValue>;
  const patch: Array<[string, PatchValue]> = [
    ['name', optionalTrimmed(input.name, data.name)],
    ['address', optionalTrimmed(input.address, data.address)],
    ['lat', optionalValue(input.coordinates?.lat, data.lat)],
    ['lng', optionalValue(input.coordinates?.lng, data.lng)],
    ['phone', optionalValue(input.phone, data.phone)],
    ['email', optionalValue(input.email, data.email)],
  ];
  let changed = false;
  for (const [key, value] of patch)
    if (value !== record[key]) {
      record[key] = value;
      changed = true;
    }
  // Адреса-структура застосовується після скалярного патча: display-рядок
  // завжди перераховується з частин, а не з legacy `address`.
  if (input.addressParts && (!data.addressParts || !input.addressParts.equals(data.addressParts))) {
    data.addressParts = input.addressParts;
    data.address = input.addressParts.formatted();
    changed = true;
  }
  return changed;
}

export function applyActive(data: LocationData, active: boolean): boolean {
  if (data.active === active) return false;
  data.active = active;
  return true;
}

export function applyChannels(data: LocationData, channels: ChannelData[]): boolean {
  if (JSON.stringify(channels) === JSON.stringify(data.channels)) return false;
  data.channels = channels;
  return true;
}

export function applyPhotos(data: LocationData, photos: PhotoData[]): boolean {
  if (JSON.stringify(photos) === JSON.stringify(data.photos)) return false;
  data.photos = photos;
  return true;
}

export function applyHours(data: LocationData, hours: OpeningHours): boolean {
  if (data.hours.equals(hours)) return false;
  data.hours = hours;
  return true;
}

export function applyChairs(data: LocationData, chairs: Chair[]): boolean {
  if (chairs.length !== CHAIR_LIMIT) throw new Error('Location must have exactly 2 chairs');
  const changed = chairs.some(
    (c, i) => c.active !== data.chairs[i]?.active || c.name !== data.chairs[i]?.name
  );
  data.chairs = chairs;
  return changed;
}
