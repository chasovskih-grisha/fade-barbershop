// Спільні елементи публічного «найближчі локації»: парсинг геолокації з
// query-параметрів (без class-validator — його в API немає; валідація діапазонів
// тут) і DTO відповіді. Координати клієнта — лише в пам'яті запиту: не
// логувати, не зберігати (приватність геолокації).

import type { Location } from '../domain/location';
import type { FindNearestLocationsResult } from '../application/find-nearest-locations';

/** Сирі query-параметри Nest (@Query() без pipe — рядки). */
export interface GeoQuery {
  lat?: string | string[];
  lng?: string | string[];
}

export interface GeoCoords {
  lat: number;
  lng: number;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Парсить і валідує координати; невалідні/відсутні → undefined (список без сортування). */
export function geoFromQuery(query: GeoQuery): GeoCoords | undefined {
  const lat = Number(first(query.lat));
  const lng = Number(first(query.lng));
  const latOk = query.lat !== undefined && Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const lngOk = query.lng !== undefined && Number.isFinite(lng) && lng >= -180 && lng <= 180;
  return latOk && lngOk ? { lat, lng } : undefined;
}

export interface NearestLocationDto {
  id: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  distanceKm: number | null;
}

export interface NearestLocationsResponseDto {
  city: string | null;
  sortedByDistance: boolean;
  locations: NearestLocationDto[];
}

export function toNearestLocationDto(
  location: Location,
  distanceKm: number | null
): NearestLocationDto {
  return {
    id: location.id,
    code: location.code,
    name: location.name,
    address: location.address,
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
    distanceKm,
  };
}

export function toNearestLocationsResponse(
  result: FindNearestLocationsResult
): NearestLocationsResponseDto {
  return {
    city: result.city,
    sortedByDistance: result.sortedByDistance,
    locations: result.locations.map((e) => toNearestLocationDto(e.location, e.distanceKm)),
  };
}
