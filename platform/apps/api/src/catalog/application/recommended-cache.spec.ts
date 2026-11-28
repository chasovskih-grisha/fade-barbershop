// Скидання кешу блоку «рекомендуємо» (T-4445): адмінка після масової зміни
// цін не має чекати хвилину, поки головна покаже новий набір послуг.
import type { RecommendedService } from '../domain/recommended-services';
import { RecommendedServicesService } from './recommended-services.service';
import {
  FakeRecommendedCatalog,
  FakeServiceDemand,
  FixedClock,
  InMemoryRecommendationMetrics,
  InMemoryRecommendedConfigRepository,
} from './recommended.fakes';

const LOCATION = 'loc-1';
const OTHER = 'loc-2';
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
  return { config, demand, clock, service: new RecommendedServicesService(ports) };
};

describe('RecommendedServicesService: кеш (T-4445)', () => {
  it('скидає кеш локації, не чіпаючи інші локації', async () => {
    const { demand, service: recommended } = setup();
    demand.rows = [{ serviceId: 'a', bookings: 3 }];

    await recommended.block({ locationId: LOCATION });
    await recommended.block({ locationId: OTHER });
    expect(demand.calls).toBe(2);

    recommended.invalidate(LOCATION);
    await recommended.block({ locationId: OTHER });
    expect(demand.calls).toBe(2);

    await recommended.block({ locationId: LOCATION });
    expect(demand.calls).toBe(3);
  });

  it('invalidate() без аргументу скидає кеш усіх локацій', async () => {
    const { demand, service: recommended } = setup();
    demand.rows = [{ serviceId: 'a', bookings: 3 }];

    await recommended.block({ locationId: LOCATION });
    await recommended.block({ locationId: OTHER });
    recommended.invalidate();

    await recommended.block({ locationId: LOCATION });
    await recommended.block({ locationId: OTHER });
    expect(demand.calls).toBe(4);
  });

  it('зміна мережевого дефолту скидає кеш локацій без власного конфігу', async () => {
    const { service: recommended } = setup();
    const before = await recommended.block({ locationId: LOCATION });
    expect(before.source).toBe('fallback');

    await recommended.saveConfig({ locationId: null, mode: 'manual', serviceIds: ['b'], limit: 1 });
    const after = await recommended.block({ locationId: LOCATION });

    expect(after.mode).toBe('manual');
    expect(after.services.map((s) => s.id)).toEqual(['b']);
  });
});
