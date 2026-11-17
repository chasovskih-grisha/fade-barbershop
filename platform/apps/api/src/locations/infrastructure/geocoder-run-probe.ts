// runProbe — захищений виклик провайдера геокодера (виділено з декоратора
// за лімітом розміру файлу, ADR 0019): будь-який виняток (мережа, таймаут,
// невалідна відповідь) деградує до { ok: false, city: null } — контракт
// Geocoder не кидає, список локацій не залежить від геокодера.

import type { CityInfo, Geocoder } from '../domain/ports';

export interface ProbeResult {
  readonly ok: boolean;
  readonly city: CityInfo | null;
}

export async function runProbe(inner: Geocoder, lat: number, lng: number): Promise<ProbeResult> {
  try {
    return { ok: true, city: await inner.reverseGeocode(lat, lng) };
  } catch {
    return { ok: false, city: null };
  }
}
