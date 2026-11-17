import {
  StubGeocoder,
  T0,
  freshStores,
  geocoderFor,
} from './cached-rate-limited.geocoder.failure.fakes';

describe('CachedRateLimitedGeocoder failure handling', () => {
  it('після 3 збоїв — надгробок на 60 с (глобальний ключ порту)', async () => {
    const failing = new StubGeocoder(null, true);
    const stores = freshStores();
    let t = T0;
    const g = geocoderFor(failing, stores, () => t);
    for (let i = 0; i < 3; i++) await g.reverseGeocode(50.45, 30.52 + i * 0.01);
    expect(failing.calls).toHaveLength(3);
    await g.reverseGeocode(50.99, 30.99);
    expect(failing.calls).toHaveLength(3); // заблоковано надгробком (глобальний ключ)
    t += 60_001;
    await g.reverseGeocode(50.99, 30.99);
    expect(failing.calls).toHaveLength(4); // надгробок скінчився
  });

  it('надгробок спільний: інший декоратор на тому ж сховищі теж мовчить', async () => {
    const failing = new StubGeocoder(null, true);
    const stores = freshStores();
    const t = T0;
    const g1 = geocoderFor(failing, stores, () => t);
    const g2 = geocoderFor(failing, stores, () => t); // «другий контейнер»
    for (let i = 0; i < 3; i++) await g1.reverseGeocode(50.45, 30.52 + i * 0.01);
    await g2.reverseGeocode(50.99, 30.99);
    expect(failing.calls).toHaveLength(3); // g2 не викликав провайдера
  });
});
