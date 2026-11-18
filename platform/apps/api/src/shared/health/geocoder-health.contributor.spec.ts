// Специфікація GeocoderHealthContributor: щасливий шлях (зріз лічильників +
// режими обох адаптерів) і деградація — помилка describe не ламає пробу.

import { GeocoderHealthContributor } from './geocoder-health.contributor';
import { GeocoderMetrics } from '../../locations/infrastructure/geocoder-metrics';
import { GeocoderStoresFactory } from '../../locations/infrastructure/geocoder-stores.factory';

describe('GeocoderHealthContributor', () => {
  it('snapshot повертає лічильники і режими сховищ обох адаптерів', async () => {
    const metrics = new GeocoderMetrics();
    metrics.increment('cache_hit');
    const contributor = new GeocoderHealthContributor();
    const section = await contributor.snapshot(metrics, new GeocoderStoresFactory());
    expect(section.counters).toMatchObject({ cache_hit: 1 });
    expect(section.stores).toMatchObject({
      nominatim: { adapter: 'nominatim', effective: 'local' },
      google: { adapter: 'google', effective: 'local' },
    });
    expect(section.stores).not.toBeNull();
  });

  it('помилка describe не ламає пробу: stores=null, лічильники на місці', async () => {
    const metrics = new GeocoderMetrics();
    metrics.increment('provider_failure');
    const broken = {
      describe: () => Promise.reject(new Error('boom')),
    } as unknown as GeocoderStoresFactory;
    const section = await new GeocoderHealthContributor().snapshot(metrics, broken);
    expect(section.counters).toMatchObject({ provider_failure: 1 });
    expect(section.stores).toBeNull();
  });
});
