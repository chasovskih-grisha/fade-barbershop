// Блок «рекомендуємо» (T-4445): ручний вибір, топ тижня, холодний старт,
// ліміт, фільтр за локацією, кеш на хвилину і перевірка конфігу.
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
const service = (id: string): RecommendedService => ({
  id,
  name: id.toUpperCase(),
  duration: 30,
  category: null,
  priceUah: 400,
});
const NOW = new Date('2026-11-27T12:00:00.000Z');

const setup = (services: RecommendedService[] = ['a', 'b', 'c', 'd'].map(service)) => {
  const config = new InMemoryRecommendedConfigRepository();
  const demand = new FakeServiceDemand();
  const catalog = new FakeRecommendedCatalog();
  catalog.services = services;
  const clock = new FixedClock(NOW);
  const ports = { config, demand, catalog, metrics: new InMemoryRecommendationMetrics(), clock };
  return { config, demand, catalog, clock, service: new RecommendedServicesService(ports) };
};

describe('RecommendedServicesService (T-4445)', () => {
  it('ручний вибір показує послуги в заданому порядку й ріже по ліміту', async () => {
    const { config, service: recommended } = setup();
    await config.save({
      locationId: LOCATION,
      mode: 'manual',
      serviceIds: ['c', 'a', 'b'],
      limit: 2,
    });

    const block = await recommended.block({ locationId: LOCATION });

    expect(block.source).toBe('manual');
    expect(block.services.map((s) => s.id)).toEqual(['c', 'a']);
    expect(block.services[0]).toMatchObject({ name: 'C', priceUah: 400 });
  });

  it('топ тижня бере найпопулярніші послуги локації за записами', async () => {
    const { config, demand, service: recommended } = setup();
    await config.save({ locationId: LOCATION, mode: 'top-week', serviceIds: [], limit: 3 });
    demand.rows = [
      { serviceId: 'd', bookings: 9 },
      { serviceId: 'b', bookings: 5 },
      { serviceId: 'x', bookings: 100 }, // не продається тут — відкидається
      { serviceId: 'a', bookings: 1 },
    ];

    const block = await recommended.block({ locationId: LOCATION });

    expect(block.source).toBe('demand');
    expect(block.services.map((s) => s.id)).toEqual(['d', 'b', 'a']);
    expect(demand.lastWindow).toMatchObject({ locationId: LOCATION });
    expect(demand.lastWindow?.from.toISOString()).toBe('2026-11-20T12:00:00.000Z');
  });

  it('без конфігу й без попиту — холодний старт у порядку каталогу', async () => {
    const { service: recommended } = setup(['a', 'b', 'c', 'd', 'e'].map(service));

    const block = await recommended.block({ locationId: LOCATION });

    expect(block.mode).toBe('top-week');
    expect(block.source).toBe('fallback');
    expect(block.services.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('кешує блок на хвилину і перераховує після її кінця', async () => {
    const { demand, clock, service: recommended } = setup();
    demand.rows = [{ serviceId: 'a', bookings: 2 }];

    await recommended.block({ locationId: LOCATION });
    await recommended.block({ locationId: LOCATION });
    expect(demand.calls).toBe(1);

    clock.advance(59_000);
    await recommended.block({ locationId: LOCATION });
    expect(demand.calls).toBe(1);

    clock.advance(2_000);
    await recommended.block({ locationId: LOCATION });
    expect(demand.calls).toBe(2);
  });
});
