import { Address } from './address';
import { defaultChairs, normalizeCode, normalizeRequired } from './location.helpers';
import type { CreateLocationInput, LocationData } from './location.types';

export function createLocationData(input: CreateLocationInput): LocationData {
  const addressParts = input.addressParts ? Address.of(input.addressParts) : null;
  return {
    id: input.id,
    code: normalizeCode(input.code),
    name: normalizeRequired(input.name, 'Name'),
    address: addressParts?.formatted() ?? normalizeRequired(input.address, 'Address'),
    addressParts,
    lat: input.coordinates.lat,
    lng: input.coordinates.lng,
    phone: input.phone ?? null,
    email: input.email ?? null,
    active: true,
    chairs: defaultChairs(),
    channels: [],
    photos: [],
    hours: input.hours,
    createdAt: input.createdAt,
  };
}
