// WebVitalsMetrics — RUM (T-4204): лічильники Core Web Vitals з реальних
// клієнтів. Лічимо лише пари (metric, rating): кардинальність фіксована
// 5 × 3, а сире значення з клієнта (мс/безрозмірне) не потрапляє в лейбл.
// Публічний маяк не має ламати шлях: невідомі назви/рейтинги ігноруються
// (патерн GeocoderMetrics — метрики не кидають).
import { Injectable } from '@nestjs/common';

/** Метрики, які віддає web-vitals: LCP/INP/CLS/FCP/TTFB. */
export const WEB_VITALS_METRICS = ['lcp', 'inp', 'cls', 'fcp', 'ttfb'] as const;
/** Рейтинг web-vitals: good | needs-improvement | poor. */
export const WEB_VITALS_RATINGS = ['good', 'needs-improvement', 'poor'] as const;

export type WebVitalsMetric = (typeof WEB_VITALS_METRICS)[number];
export type WebVitalsRating = (typeof WEB_VITALS_RATINGS)[number];

const isMetric = (value: string): value is WebVitalsMetric =>
  (WEB_VITALS_METRICS as readonly string[]).includes(value);
const isRating = (value: string): value is WebVitalsRating =>
  (WEB_VITALS_RATINGS as readonly string[]).includes(value);

const normalized = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

@Injectable()
export class WebVitalsMetrics {
  private readonly counters = new Map<string, number>();

  /** Записує семпл; повертає false, якщо семпл відкинуто як невалідний. */
  record(sample: unknown): boolean {
    try {
      const source = (sample ?? {}) as { name?: unknown; rating?: unknown };
      const name = normalized(source.name);
      const rating = normalized(source.rating);
      if (!isMetric(name) || !isRating(rating)) return false;
      const key = name + '|' + rating;
      this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
      return true;
    } catch {
      return false;
    }
  }

  /** Знімок для /metrics: { metric: { rating: count } }, нулі не емітятся. */
  snapshot(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    for (const [key, value] of this.counters) {
      const [metric, rating] = key.split('|');
      const bucket = (result[metric ?? 'other'] ??= {});
      bucket[rating ?? 'other'] = value;
    }
    return result;
  }
}
