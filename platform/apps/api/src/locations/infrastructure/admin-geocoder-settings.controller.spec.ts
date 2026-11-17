// Специфікація AdminGeocoderSettingsController: GET показує провайдера і
// прапорець ключа Google; PUT мержить часткові зміни з поточними значеннями.

import { AdminGeocoderSettingsController } from './admin-geocoder-settings.controller';
import { PrismaGeocoderSettings } from './prisma-geocoder-settings';
import { GoogleGeocoder } from './google-geocoder';
import { DEFAULT_GEOCODER_SETTINGS } from '../domain/geocoder-settings';

function settingsStub() {
  let current = { ...DEFAULT_GEOCODER_SETTINGS };
  return {
    get: async () => current,
    set: async (next: typeof current) => {
      current = next;
    },
  } as unknown as PrismaGeocoderSettings;
}

function googleStub(configured: boolean) {
  return { configured } as GoogleGeocoder;
}

describe('AdminGeocoderSettingsController (MNG-ADM-18)', () => {
  it('GET повертає налаштування + googleConfigured=false без ключа', async () => {
    const controller = new AdminGeocoderSettingsController(settingsStub(), googleStub(false));
    const result = await controller.get();
    expect(result).toMatchObject({ provider: 'nominatim', googleConfigured: false });
  });

  it('PUT міняє тільки провайдера, решта полів лишається', async () => {
    const settings = settingsStub();
    const controller = new AdminGeocoderSettingsController(settings, googleStub(true));
    const result = await controller.update({ provider: 'google' });
    expect(result).toMatchObject({
      provider: 'google',
      cacheTtlMs: DEFAULT_GEOCODER_SETTINGS.cacheTtlMs,
    });
    expect((await settings.get()).provider).toBe('google');
  });

  it('PUT з частковим rateLimit мержить max і windowMs окремо', async () => {
    const controller = new AdminGeocoderSettingsController(settingsStub(), googleStub(false));
    const result = await controller.update({ rateLimit: { max: 10 } });
    expect(result.rateLimit).toEqual({
      max: 10,
      windowMs: DEFAULT_GEOCODER_SETTINGS.rateLimit.windowMs,
    });
  });

  it('PUT зі сміттям не кидає і не ламає збережені налаштування', async () => {
    const settings = settingsStub();
    const controller = new AdminGeocoderSettingsController(settings, googleStub(false));
    const result = await controller.update({ provider: 'hack', rateLimit: { max: -1 } });
    expect(result.provider).toBe('nominatim');
    expect(result.rateLimit.max).toBeGreaterThanOrEqual(1);
  });

  it('PUT без тіла зберігає поточні значення (ідемпотентно)', async () => {
    const controller = new AdminGeocoderSettingsController(settingsStub(), googleStub(false));
    const before = await controller.get();
    const after = await controller.update(undefined);
    expect(after).toMatchObject({ provider: before.provider, cacheTtlMs: before.cacheTtlMs });
  });
});
