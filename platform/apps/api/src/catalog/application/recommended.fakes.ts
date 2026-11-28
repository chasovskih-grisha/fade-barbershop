// Памʼять замість Prisma для блоку «рекомендуємо» (T-4445): той самий порт, що
// й у проді, тож сценарії перевіряються через справжній сервіс.
import type { Clock } from '../domain/ports';
import type {
  RecommendationEventKind,
  RecommendedConfig,
  RecommendedService,
  ServiceDemand,
} from '../domain/recommended-services';
import type {
  MetricRow,
  RecommendationMetricsPort,
  RecommendedCatalogPort,
  RecommendedConfigRepository,
  ServiceDemandReader,
} from './recommended-ports';

const keyOf = (locationId: string | null) => locationId ?? '*';

export class InMemoryRecommendedConfigRepository implements RecommendedConfigRepository {
  readonly rows = new Map<string, RecommendedConfig>();

  async find(locationId: string | null): Promise<RecommendedConfig | null> {
    return this.rows.get(keyOf(locationId)) ?? null;
  }

  async save(config: RecommendedConfig): Promise<RecommendedConfig> {
    this.rows.set(keyOf(config.locationId), config);
    return config;
  }
}

export class FakeServiceDemand implements ServiceDemandReader {
  rows: ServiceDemand[] = [];
  calls = 0;
  lastWindow: { from: Date; to: Date; locationId: string | null } | null = null;

  async topServices(input: {
    from: Date;
    to: Date;
    locationId: string | null;
    limit: number;
  }): Promise<ServiceDemand[]> {
    this.calls += 1;
    this.lastWindow = { from: input.from, to: input.to, locationId: input.locationId };
    // Адаптер обрізає вибірку для розміру відповіді; тут лишаємо все,
    // щоб перевіряти саме правило вибору.
    return [...this.rows];
  }
}

export class FakeRecommendedCatalog implements RecommendedCatalogPort {
  services: RecommendedService[] = [];

  async listSellable(): Promise<RecommendedService[]> {
    return this.services;
  }
}

export class InMemoryRecommendationMetrics implements RecommendationMetricsPort {
  readonly counts = new Map<string, number>();

  async bump(input: {
    day: Date;
    serviceId: string;
    kind: RecommendationEventKind;
  }): Promise<void> {
    const key = `${input.day.toISOString().slice(0, 10)}|${input.serviceId}|${input.kind}`;
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  async summarize(input: { from: Date; to: Date }): Promise<MetricRow[]> {
    const rows = new Map<string, MetricRow>();
    for (const [key, count] of this.counts) {
      const [day = '', serviceId = '', kind = ''] = key.split('|');
      const at = new Date(`${day}T00:00:00.000Z`);
      if (at < input.from || at > input.to) continue;
      const id = `${serviceId}|${kind}`;
      const row = rows.get(id) ?? { serviceId, kind: kind as RecommendationEventKind, count: 0 };
      rows.set(id, { ...row, count: row.count + count });
    }
    return [...rows.values()];
  }
}

export class FixedClock implements Clock {
  constructor(private at: Date) {}

  now(): Date {
    return new Date(this.at);
  }

  advance(ms: number): void {
    this.at = new Date(this.at.getTime() + ms);
  }
}
