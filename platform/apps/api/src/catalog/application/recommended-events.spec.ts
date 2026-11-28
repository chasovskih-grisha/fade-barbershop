// Метрика блоку «рекомендуємо» (T-4445): показ і клік рахуються добовими
// лічильниками; чужа послуга чи невідомий тип події не потрапляють у зріз.
import {
  InvalidRecommendationEvent,
  UnknownRecommendedService,
  type RecommendedService,
} from '../domain/recommended-services';
import { RecommendedEventsService, utcDay } from './recommended-events.service';
import {
  FakeRecommendedCatalog,
  FixedClock,
  InMemoryRecommendationMetrics,
} from './recommended.fakes';

const NOW = new Date('2026-11-27T22:30:00.000Z');
const service = (id: string): RecommendedService => ({
  id,
  name: id,
  duration: 30,
  category: null,
  priceUah: null,
});

const setup = () => {
  const catalog = new FakeRecommendedCatalog();
  catalog.services = [service('a'), service('b')];
  const metrics = new InMemoryRecommendationMetrics();
  const clock = new FixedClock(NOW);
  return { catalog, metrics, clock, events: new RecommendedEventsService(catalog, metrics, clock) };
};

describe('RecommendedEventsService (T-4445)', () => {
  it('рахує показ окремо від кліку й повертає добу в UTC', async () => {
    const { events, metrics } = setup();

    await events.record({ serviceId: 'a', kind: 'impression' });
    await events.record({ serviceId: 'a', kind: 'impression' });
    const click = await events.record({ serviceId: 'a', kind: 'click' });

    expect(click).toEqual({ serviceId: 'a', kind: 'click', day: '2026-11-27' });
    expect([...metrics.counts.entries()]).toEqual([
      ['2026-11-27|a|impression', 2],
      ['2026-11-27|a|click', 1],
    ]);
  });

  it('зріз за період сумує лічильники по послузі й типу події', async () => {
    const { events, metrics, clock } = setup();
    await events.record({ serviceId: 'a', kind: 'click' });
    clock.advance(24 * 60 * 60 * 1000);
    await events.record({ serviceId: 'a', kind: 'click' });
    await events.record({ serviceId: 'b', kind: 'impression' });

    const rows = await events.summarize({
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-12-01T00:00:00.000Z'),
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        { serviceId: 'a', kind: 'click', count: 2 },
        { serviceId: 'b', kind: 'impression', count: 1 },
      ])
    );
    expect(metrics.counts.size).toBe(3);
  });

  it('відхиляє невідомий тип події та послугу поза каталогом локації', async () => {
    const { events, metrics } = setup();

    await expect(events.record({ serviceId: 'a', kind: 'hover' })).rejects.toBeInstanceOf(
      InvalidRecommendationEvent
    );
    await expect(events.record({ serviceId: 'zzz', kind: 'click' })).rejects.toBeInstanceOf(
      UnknownRecommendedService
    );
    expect(metrics.counts.size).toBe(0);
  });

  it('доба лічильника — UTC-північ, а не локальна', () => {
    expect(utcDay(new Date('2026-11-27T23:59:59.000Z')).toISOString()).toBe(
      '2026-11-27T00:00:00.000Z'
    );
  });
});
