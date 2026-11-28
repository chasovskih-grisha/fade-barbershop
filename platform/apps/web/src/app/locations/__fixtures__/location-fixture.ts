import type { Location } from '@/lib/api/locations';

// Один запис студії з координатами — спільний для тестів карти (T-4826).

export function location(
  code: string,
  name: string,
  [lat, lng]: [number, number]
): Location {
  return {
    id: code,
    code,
    name,
    address: 'Тепла, 5',
    addressParts: { city: 'Київ' },
    lat,
    lng,
    hours: [],
    chairs: [],
    photos: [],
    logo: null,
  } as unknown as Location;
}
