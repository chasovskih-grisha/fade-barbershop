// FindNearestLocations — публічний запит сайту і флоу запису (web-screens §1:
// «найближча локація»; геолокація — фаза 9+). Активні локації сортуються за
// відстанню від клієнта в межах NEAREST_RADIUS_KM; за межами радіуса — фільтр
// по місту (зворотне геокодування), якщо місто збігається з адресою якоїсь
// локації; інакше — початковий порядок (code ASC). Жоден сценарій не ховає
// всі локації: незнане місто/далека відстань = звичайний список.

import { distanceKm } from '../domain/haversine';
import type { Location } from '../domain/location';
import type { Geocoder } from '../domain/ports';

/** Радіус, у якому сортування «найближчих» вважається корисним (місто/агломерація). */
export const NEAREST_RADIUS_KM = 50;

export interface NearestLocation {
  readonly location: Location;
  /** Відстань у км; null — координати клієнта не передані. */
  readonly distanceKm: number | null;
}

export interface FindNearestLocationsResult {
  readonly locations: readonly NearestLocation[];
  /** Місто клієнта (зворотне геокодування); null — не розпізнано. */
  readonly city: string | null;
  /** true — список відсортовано за відстанню (клієнт у радіусі мережі). */
  readonly sortedByDistance: boolean;
}

export interface FindNearestLocationsInput {
  readonly lat?: number;
  readonly lng?: number;
}

export class FindNearestLocationsHandler {
  constructor(
    private readonly locations: { listActive(): Promise<Location[]> },
    private readonly geocoder: Geocoder | null = null
  ) {}

  async handle(input: FindNearestLocationsInput = {}): Promise<FindNearestLocationsResult> {
    const active = await this.locations.listActive();
    const hasCoords = typeof input.lat === 'number' && typeof input.lng === 'number';

    let city: string | null = null;
    if (hasCoords && this.geocoder) {
      city = await this.geocoder
        .reverseGeocode(input.lat, input.lng)
        .then((r) => r?.city ?? null)
        .catch(() => null);
    }

    const entries: NearestLocation[] = active.map((location) => ({
      location,
      distanceKm: hasCoords
        ? distanceKm(
            { latitude: input.lat, longitude: input.lng },
            { latitude: location.lat, longitude: location.lng }
          )
        : null,
    }));

    const inRadius = entries.filter(
      (e): e is NearestLocation & { distanceKm: number } =>
        e.distanceKm !== null && e.distanceKm <= NEAREST_RADIUS_KM
    );
    const cityMatches = (l: Location): boolean => city !== null && l.address.includes(city);

    if (inRadius.length > 0) {
      inRadius.sort((a, b) => a.distanceKm - b.distanceKm);
      return { locations: inRadius, city, sortedByDistance: true };
    }
    if (city !== null && active.some(cityMatches)) {
      return {
        locations: entries.filter((e) => cityMatches(e.location)),
        city,
        sortedByDistance: false,
      };
    }
    return { locations: entries, city, sortedByDistance: false };
  }
}
