// Пров'язування блоку «рекомендуємо» (T-4445) в одному місці: адаптери,
// токени портів і пакет залежностей, який читає сервіс.
import { PrismaRecommendedConfigRepository } from './prisma-recommended-config.repository';
import { PrismaRecommendedCatalog } from './prisma-recommended-catalog';
import { PrismaRecommendationMetricsRepository } from './prisma-recommendation-metrics.repository';
import { RecommendedServicesService } from '../application/recommended-services.service';
import { RecommendedEventsService } from '../application/recommended-events.service';
import {
  RECOMMENDED_CATALOG,
  RECOMMENDED_CLOCK,
  RECOMMENDED_CONFIG,
  RECOMMENDED_DEMAND,
  RECOMMENDED_METRICS,
  RECOMMENDED_PORTS,
  type Clock,
  type RecommendedCatalogPort,
  type RecommendedConfigRepository,
  type RecommendationMetricsPort,
  type ServiceDemandReader,
} from '../application/recommended-ports';

const CLOCK: Clock = { now: () => new Date() };

export const RECOMMENDED_PROVIDERS = [
  PrismaRecommendedConfigRepository,
  PrismaRecommendedCatalog,
  PrismaRecommendationMetricsRepository,
  RecommendedServicesService,
  RecommendedEventsService,
  { provide: RECOMMENDED_CONFIG, useExisting: PrismaRecommendedConfigRepository },
  { provide: RECOMMENDED_CATALOG, useExisting: PrismaRecommendedCatalog },
  { provide: RECOMMENDED_DEMAND, useExisting: PrismaRecommendedCatalog },
  { provide: RECOMMENDED_METRICS, useExisting: PrismaRecommendationMetricsRepository },
  { provide: RECOMMENDED_CLOCK, useValue: CLOCK },
  {
    provide: RECOMMENDED_PORTS,
    // Той самий прийом, що й у сусідніх провайдерах: один rest-параметр
    // розкладається в пакет залежностей (сімейство правил max-params).
    useFactory: (
      ...[config, demand, catalog, metrics, clock]: [
        RecommendedConfigRepository,
        ServiceDemandReader,
        RecommendedCatalogPort,
        RecommendationMetricsPort,
        Clock,
      ]
    ) => ({ config, demand, catalog, metrics, clock }),
    inject: [
      RECOMMENDED_CONFIG,
      RECOMMENDED_DEMAND,
      RECOMMENDED_CATALOG,
      RECOMMENDED_METRICS,
      RECOMMENDED_CLOCK,
    ],
  },
];
