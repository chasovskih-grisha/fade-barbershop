// Метрика блоку «рекомендуємо» (T-4445): показ і клік рахуються добовими
// лічильниками, а адмінка читає зріз за період. Домен перевіряє, що подія
// стосується послуги, яку тут справді можна записати.
import { Inject, Injectable } from '@nestjs/common';
import { assertEventKind, type RecommendationEventKind } from '../domain/recommended-services';
import { UnknownRecommendedService } from '../domain/recommended-services';
import {
  RECOMMENDED_CATALOG,
  RECOMMENDED_CLOCK,
  RECOMMENDED_METRICS,
  type Clock,
  type MetricRow,
  type RecommendationMetricsPort,
  type RecommendedCatalogPort,
} from './recommended-ports';

@Injectable()
export class RecommendedEventsService {
  constructor(
    @Inject(RECOMMENDED_CATALOG) private readonly catalog: RecommendedCatalogPort,
    @Inject(RECOMMENDED_METRICS) private readonly metrics: RecommendationMetricsPort,
    @Inject(RECOMMENDED_CLOCK) private readonly clock: Clock
  ) {}

  async record(input: {
    serviceId: string;
    kind: string;
    locationId?: string | null;
  }): Promise<{ serviceId: string; kind: RecommendationEventKind; day: string }> {
    const kind = assertEventKind(input.kind);
    const locationId = input.locationId ?? null;
    const sellable = await this.catalog.listSellable(locationId);
    if (!sellable.some((service) => service.id === input.serviceId))
      throw new UnknownRecommendedService(input.serviceId);

    const day = utcDay(this.clock.now());
    await this.metrics.bump({ day, serviceId: input.serviceId, kind });
    return { serviceId: input.serviceId, kind, day: day.toISOString().slice(0, 10) };
  }

  summarize(input: { from: Date; to: Date }): Promise<MetricRow[]> {
    return this.metrics.summarize(input);
  }
}

/** Доба в UTC: лічильник не «переїжджає» через часовий пояс сервера. */
export const utcDay = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
