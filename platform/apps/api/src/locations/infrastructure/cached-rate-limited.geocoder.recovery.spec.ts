import { StubGeocoder, T0, freshStores, geocoderFor } from './cached-rate-limited.geocoder.failure.fakes';
import type { Geocoder } from '../domain/ports';

describe('CachedRateLimitedGeocoder recovery and shared cache', () => {
  it('успішна відповідь скидає лічильник збоїв', async () => {
    const failing = new StubGeocoder(null, true);
    const succeeding = new StubGeocoder({ city: 'Львів' });
    const gate = { useFailing: true };
    const stores = freshStores();
    let t = T0;
    const flaky: Geocoder = {
      reverseGeocode: (lat: number, lng: number) =>
        gate.useFailing ? failing.reverseGeocode(lat, lng) : succeeding.reverseGeocode(lat, lng),
    };
    const g = geocoderFor(flaky, stores, () => t);
    await g.reverseGeocode(50.45, 30.52);
    await g.reverseGeocode(50.46, 30.53);
    gate.useFailing = false;
    t += 1001; // нове вікно лімітів
    await g.reverseGeocode(50.47, 30.54);
    expect(failing.calls).toHaveLength(2);
    expect(succeeding.calls).toHaveLength(1);
    // ще 2 збої підряд — надгробок НЕ спрацьовує (лічильник був скинутий)
    gate.useFailing = true;
    t += 1001;
    await g.reverseGeocode(50.48, 30.55);
    t += 1001;
    await g.reverseGeocode(50.49, 30.56);
    expect(failing.calls).toHaveLength(4);
  });

  it('спільні сховища: два інстанси ділять кеш (multi-container)', async () => {
    const stores = freshStores();
    const a = new StubGeocoder();
    const b = new StubGeocoder();
    const ga = geocoderFor(a, stores, () => T0);
    const gb = geocoderFor(b, stores, () => T0);

    await ga.reverseGeocode(50.45, 30.52);
    expect(await gb.reverseGeocode(50.45, 30.52)).toEqual({ city: 'Київ' });
    expect(a.calls).toHaveLength(1);
  });
});
