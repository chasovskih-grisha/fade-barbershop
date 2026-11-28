// Порти блоку «рекомендуємо» (T-4445): конфіг, попит за тиждень, каталог і
// лічильники показів/кліків. Домен не знає, звідки вони беруться.
import type { Clock } from '../domain/ports';
import type {
  RecommendationEventKind,
  RecommendedConfig,
  RecommendedService,
  ServiceDemand,
} from '../domain/recommended-services';

export const RECOMMENDED_CONFIG = 'RecommendedConfigRepository';
export const RECOMMENDED_PORTS = 'RecommendedPorts';
export const RECOMMENDED_DEMAND = 'ServiceDemandReader';
export const RECOMMENDED_CATALOG = 'RecommendedCatalog';
export const RECOMMENDED_METRICS = 'RecommendationMetrics';
export const RECOMMENDED_CLOCK = 'RecommendedClock';

export interface RecommendedConfigRepository {
  /** `null` — мережевий дефолт, коли для локації нічого не налаштовано. */
  find(locationId: string | null): Promise<RecommendedConfig | null>;
  save(config: RecommendedConfig): Promise<RecommendedConfig>;
}

export interface ServiceDemandReader {
  topServices(input: {
    from: Date;
    to: Date;
    locationId: string | null;
    limit: number;
  }): Promise<ServiceDemand[]>;
}

export interface RecommendedCatalogPort {
  listSellable(locationId: string | null): Promise<RecommendedService[]>;
}

export type MetricRow = { serviceId: string; kind: RecommendationEventKind; count: number };

export interface RecommendationMetricsPort {
  bump(input: { day: Date; serviceId: string; kind: RecommendationEventKind }): Promise<void>;
  summarize(input: { from: Date; to: Date }): Promise<MetricRow[]>;
}

export type RecommendedPorts = {
  config: RecommendedConfigRepository;
  demand: ServiceDemandReader;
  catalog: RecommendedCatalogPort;
  metrics: RecommendationMetricsPort;
  clock: Clock;
};

export type { Clock };
