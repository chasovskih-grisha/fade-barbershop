// Специфікація SettingsRoutingGeocoder: вибір провайдера за налаштуваннями
// MNG-ADM-18 і fallback на Nominatim, якщо google не сконфігурований.

import { SettingsRoutingGeocoder } from './settings-routing.geocoder';
import {
  DEFAULT_GEOCODER_SETTINGS,
  type GeocoderSettings,
  type GeocoderSettingsPort,
} from '../domain/geocoder-settings';
import type { CityInfo, Geocoder } from '../domain/ports';

class Stub implements Geocoder {
  calls: Array<[number, number]> = [];
  constructor(private readonly city: string) {}
  async reverseGeocode(lat: number, lng: number): Promise<CityInfo | null> {
    this.calls.push([lat, lng]);
    return { city: this.city };
  }
}

function settingsPort(current: GeocoderSettings): GeocoderSettingsPort {
  return { get: async () => current };
}

const KYIV: [number, number] = [50.4501, 30.5234];

describe('SettingsRoutingGeocoder (вибір провайдера за MNG-ADM-18)', () => {
  it('дефолт (nominatim) викликає nominatim, google не чіпає', async () => {
    const nominatim = new Stub('Київ');
    const google = new Stub('Київ-G');
    const geocoder = new SettingsRoutingGeocoder({
      settings: settingsPort(DEFAULT_GEOCODER_SETTINGS),
      nominatim,
      google,
      googleConfigured: () => true,
    });
    expect(await geocoder.reverseGeocode(...KYIV)).toEqual({ city: 'Київ' });
    expect(nominatim.calls).toHaveLength(1);
    expect(google.calls).toHaveLength(0);
  });

  it('provider=google → викликає google', async () => {
    const nominatim = new Stub('Київ');
    const google = new Stub('Київ-G');
    const settings = { ...DEFAULT_GEOCODER_SETTINGS, provider: 'google' as const };
    const geocoder = new SettingsRoutingGeocoder({
      settings: settingsPort(settings),
      nominatim,
      google,
      googleConfigured: () => true,
    });
    expect(await geocoder.reverseGeocode(...KYIV)).toEqual({ city: 'Київ-G' });
    expect(google.calls).toHaveLength(1);
    expect(nominatim.calls).toHaveLength(0);
  });

  it('provider=google без ключа → fallback на nominatim (попередження один раз)', async () => {
    const nominatim = new Stub('Київ');
    const google = new Stub('Київ-G');
    const settings = { ...DEFAULT_GEOCODER_SETTINGS, provider: 'google' as const };
    const geocoder = new SettingsRoutingGeocoder({
      settings: settingsPort(settings),
      nominatim,
      google,
      googleConfigured: () => false,
    });
    await geocoder.reverseGeocode(...KYIV);
    await geocoder.reverseGeocode(...KYIV);
    expect(nominatim.calls).toHaveLength(2);
    expect(google.calls).toHaveLength(0);
  });
});
