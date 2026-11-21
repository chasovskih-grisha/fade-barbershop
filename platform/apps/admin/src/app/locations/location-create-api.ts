import { validateHours } from './location-hours-fields';
import type { DayHours } from './HoursEditor';
import type { AddressPartsValue } from './location-geocode-client';
import type { LocationFormValues } from './new/location-form-fields';

export interface NewLocationPayload {
  values: LocationFormValues;
  addressParts: AddressPartsValue;
  hours: DayHours[];
}

export function buildPayload({ values, addressParts, hours }: NewLocationPayload) {
  const completeAddress =
    addressParts.street.trim() && addressParts.building.trim() && addressParts.city.trim();
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    address: values.address.trim(),
    addressParts: completeAddress ? addressParts : undefined,
    lat: Number(values.lat),
    lng: Number(values.lng),
    ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
    hours,
  };
}

export async function createLocation(payload: NewLocationPayload): Promise<void> {
  const hoursError = validateHours(payload.hours);
  if (hoursError) throw new Error(hoursError);
  const response = await fetch('/admin/locations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPayload(payload)),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Не вдалося створити локацію');
  }
}

export const EMPTY_LOCATION_VALUES: LocationFormValues = {
  code: '',
  name: '',
  address: '',
  lat: '50.4501',
  lng: '30.5234',
  phone: '',
};

export const EMPTY_ADDRESS_PARTS: AddressPartsValue = {
  street: '',
  building: '',
  city: '',
  country: 'UA',
};
