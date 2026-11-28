// Конфіг блоку «рекомендуємо» (T-4445): збереження з адмінки перевіряє ліміт й
// послуги, що справді продаються, і скидає кеш блоку.
import {
  MAX_RECOMMENDED_LIMIT,
  InvalidRecommendedConfig,
  UnknownServiceInConfig,
  type RecommendedService,
} from '../domain/recommended-services';
import { RecommendedServicesService } from './recommended-services.service';
import {
  FakeRecommendedCatalog,
  FakeServiceDemand,
  FixedClock,
  InMemoryRecommendationMetrics,
  InMemoryRecommendedConfigRepository,
} from './recommended.fakes';

const LOCATION = 'loc-1';
const service = (id: string): RecommendedService => ({
  id,
  name: id.toUpperCase(),
  duration: 30,
  category: null,
  priceUah: 400,
});

const setup = () => {
  const config = new InMemoryRecommendedConfigRepository();
  const demand = new FakeServiceDemand();
  const catalog = new FakeRecommendedCatalog();
  catalog.services = ['a', 'b'].map(service);
  const clock = new FixedClock(new Date('2026-11-27T12:00:00.000Z'));
  const ports = { config, demand, catalog, metrics: new InMemoryRecommendationMetrics(), clock };
  return { demand, service: new RecommendedServicesService(ports) };
};

describe('RecommendedServicesService: конфіг (T-4445)', () => {
  it('збереження конфігу скидає кеш і перевіряє ліміт та послуги', async () => {
    const { demand, service: recommended } = setup();
    await recommended.block({ locationId: LOCATION });
    expect(demand.calls).toBe(1);

    await recommended.saveConfig({
      locationId: LOCATION,
      mode: 'manual',
      serviceIds: ['b'],
      limit: 1,
    });
    const block = await recommended.block({ locationId: LOCATION });

    expect(block.source).toBe('manual');
    expect(block.services.map((s) => s.id)).toEqual(['b']);

    await expect(
      recommended.saveConfig({
        locationId: LOCATION,
        mode: 'manual',
        serviceIds: ['zzz'],
        limit: 1,
      })
    ).rejects.toBeInstanceOf(UnknownServiceInConfig);
    await expect(
      recommended.saveConfig({ locationId: LOCATION, mode: 'manual', serviceIds: [], limit: 1 })
    ).rejects.toBeInstanceOf(InvalidRecommendedConfig);
    await expect(
      recommended.saveConfig({
        locationId: LOCATION,
        mode: 'manual',
        serviceIds: ['a'],
        limit: MAX_RECOMMENDED_LIMIT + 1,
      })
    ).rejects.toBeInstanceOf(InvalidRecommendedConfig);
  });
});
