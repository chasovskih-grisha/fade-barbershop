// GeocoderMetrics — лічильники спостережуваності декоратора CachedRateLimitedGeocoder:
// кеш-попадання/промах, відмови лімітів, надгробок, збої провайдера.
// Лічильники in-process (Map): multi-container агрегація (Prometheus, T-4204)
// збиратиме значення з кожного інстанса окремо — для /health проби достатньо.
// Лічильники тільки ростуть, increment не кидає — метрики не ламають геокодер.

import { Injectable } from '@nestjs/common';

export type GeocoderMetricName =
  | 'cache_hit'
  | 'cache_miss'
  | 'rate_limit_rejected'
  | 'tombstoned'
  | 'provider_failure'
  | 'provider_success';

const METRIC_NAMES: readonly GeocoderMetricName[] = [
  'cache_hit',
  'cache_miss',
  'rate_limit_rejected',
  'tombstoned',
  'provider_failure',
  'provider_success',
];

@Injectable()
export class GeocoderMetrics {
  private readonly counters = new Map<GeocoderMetricName, number>();

  /** +1 до лічильника; не викидає (метрики не ламають шлях запиту). */
  increment(name: GeocoderMetricName): void {
    try {
      this.counters.set(name, (this.counters.get(name) ?? 0) + 1);
    } catch {
      // Лічильник — не критичний шлях: помилка не має впливати на геокодер.
    }
  }

  snapshot(): Record<GeocoderMetricName, number> {
    const out = {} as Record<GeocoderMetricName, number>;
    for (const name of METRIC_NAMES) out[name] = this.counters.get(name) ?? 0;
    return out;
  }
}
