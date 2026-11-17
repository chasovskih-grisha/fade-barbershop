// SettingsRoutingGeocoder — Geocoder, що обирає провайдера за живими
// налаштуваннями MNG-ADM-18 (GeocoderSettingsPort): nominatim | google.
// Якщо адмін обрав google без GOOGLE_MAPS_API_KEY — деградуємо на nominatim
// (жоден сценарій не лишає клієнта без міста там, де Nominatim міг би
// відповісти). Логування fallback — без координат.

import { Injectable, Logger } from '@nestjs/common';
import type { CityInfo, Geocoder } from '../domain/ports';
import type { GeocoderSettingsPort } from '../domain/geocoder-settings';

@Injectable()
export class SettingsRoutingGeocoder implements Geocoder {
  private readonly logger = new Logger(SettingsRoutingGeocoder.name);
  private fallbackWarned = false;

  private readonly settings: GeocoderSettingsPort;
  private readonly nominatim: Geocoder;
  private readonly google: Geocoder;
  private readonly googleConfigured: () => boolean;

  constructor(options: {
    settings: GeocoderSettingsPort;
    nominatim: Geocoder;
    google: Geocoder;
    /** Google потребує ключа; без нього роутер завжди падає на nominatim. */
    googleConfigured?: () => boolean;
  }) {
    this.settings = options.settings;
    this.nominatim = options.nominatim;
    this.google = options.google;
    this.googleConfigured = options.googleConfigured ?? (() => true);
  }

  async reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    const { provider } = await this.settings.get();
    if (provider === 'google' && !this.googleConfigured()) {
      if (!this.fallbackWarned) {
        this.logger.warn(
          'Geocoder provider=google, але GOOGLE_MAPS_API_KEY не задано — fallback на nominatim'
        );
        this.fallbackWarned = true;
      }
      return this.nominatim.reverseGeocode(lat, lng);
    }
    const target = provider === 'google' ? this.google : this.nominatim;
    return target.reverseGeocode(lat, lng);
  }
}
