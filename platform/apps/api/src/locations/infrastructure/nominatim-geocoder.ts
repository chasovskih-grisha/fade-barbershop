// NominatimGeocoder — реалізація порту Geocoder на OpenStreetMap Nominatim
// (безкоштовний, без ключа; політика usage: ≤1 запит/сек, User-Agent
// обов'язковий, кеш відповідей — на боці сервісу). Викликається лише раз на
// запит корінця, що ділиться геолокацією. Координати клієнта живуть тільки в
// пам'яті запиту — не логуємо і не зберігаємо (приватність геолокації).
// Помилка/таймаут → null: список локацій не залежить від геокодера.

import { Injectable } from '@nestjs/common';
import { get as httpsGet } from 'https';
import type { CityInfo, Geocoder } from '../domain/ports';

const TIMEOUT_MS = 3000;

@Injectable()
export class NominatimGeocoder implements Geocoder {
  reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}` +
      `&zoom=10&accept-language=uk`;
    return new Promise((resolve) => {
      const req = httpsGet(
        url,
        { headers: { 'User-Agent': 'fade-platform/1.0 (public site)' }, timeout: TIMEOUT_MS },
        (res) => {
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
        }
      );
      req.on('timeout', () => req.destroy());
      req.on('error', () => resolve(null));
    });
  }
}

function parseCity(body: string): CityInfo | null {
  try {
    const json = JSON.parse(body) as {
      address?: { city?: string; town?: string; village?: string };
    };
    const city = json.address?.city ?? json.address?.town ?? json.address?.village;
    return city ? { city } : null;
  } catch {
    return null;
  }
}
