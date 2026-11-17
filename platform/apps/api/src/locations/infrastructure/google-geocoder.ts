// GoogleGeocoder — реалізація порту Geocoder на Google Geocoding API
// (ADR 0022: попередньо схвалений фолбек, якщо якість/ліміти Nominatim не
// влаштують). Ключ — GOOGLE_MAPS_API_KEY; без ключа провайдер «недоступний»
// (resolve null) — контракт Geocoder не ламає список локацій. Координати
// клієнта лише в пам'яті запиту — не логуємо і не зберігаємо (приватність).

import { Injectable } from '@nestjs/common';
import { get as httpsGet } from 'https';
import type { CityInfo, Geocoder } from '../domain/ports';

const TIMEOUT_MS = 3000;

@Injectable()
export class GoogleGeocoder implements Geocoder {
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY ?? '';

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    if (!this.configured) return Promise.resolve(null);
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(String(lat))},${encodeURIComponent(String(lng))}` +
      `&result_type=locality&language=uk&key=${encodeURIComponent(this.apiKey)}`;
    return new Promise((resolve) => {
      const req = httpsGet(url, { timeout: TIMEOUT_MS }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          body += chunk;
        });
        res.on('end', () => resolve(parseCity(body)));
      });
      req.on('timeout', () => req.destroy());
      req.on('error', () => resolve(null));
    });
  }
}

function parseCity(body: string): CityInfo | null {
  try {
    const json = JSON.parse(body) as {
      status?: string;
      results?: Array<{ address_components?: Array<{ types: string[]; long_name: string }> }>;
    };
    if (json.status !== 'OK') return null;
    for (const result of json.results ?? []) {
      const locality = (result.address_components ?? []).find((c) => c.types.includes('locality'));
      if (locality) return { city: locality.long_name };
    }
    return null;
  } catch {
    return null;
  }
}
