// HttpMetrics — SLI-лічильники запитів (T-4204, SLO/error budget за Google SRE
// Book; визначення SLO — docs/slo.md): availability = частка відповідей без 5xx,
// booking latency = частка /booking-запитів швидше за 500мс. Лічильники
// in-process (патерн GeocoderMetrics): Prometheus скрейпить кожен інстанс
// окремо; increment не кидає — метрики не ламають шлях запиту. /metrics і
// /health свідомо НЕ рахуються: інфра-проби надували б availability (скрейп
// 15s × 2 проби проти рідкого трафіку dev). /telemetry теж поза SLI: це
// RUM-маяки браузера (T-4204), а не запити клієнтів до API.
import { Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/** Поріг latency SLI booking-запису (docs/slo.md): швидше за 500мс = good. */
export const BOOKING_LATENCY_SLO_MS = 500;

const BOOKING_PREFIX = 'booking';

/** Вузький набір бакетів: значення не містять id/телефонів — не кардинальність. */
function routeBucket(path: string): string {
  const segment = '/' + (path.split('/')[1] ?? '');
  return segment === '/' || segment === '/favicon.ico' ? 'other' : segment.slice(1);
}

@Injectable()
export class HttpMetrics {
  private readonly requests = new Map<string, number>();
  private bookingSlow = 0;

  record(route: string, statusClass: string): void {
    try {
      const key = route + '|' + statusClass;
      this.requests.set(key, (this.requests.get(key) ?? 0) + 1);
    } catch {
      // Лічильник — не критичний шлях (дух GeocoderMetrics).
    }
  }

  recordBookingLatency(durationMs: number): void {
    if (durationMs >= BOOKING_LATENCY_SLO_MS) this.bookingSlow += 1;
  }

  snapshot(): { routes: Record<string, Record<string, number>>; bookingSlow: number } {
    const routes: Record<string, Record<string, number>> = {};
    for (const [key, value] of this.requests) {
      const [route, statusClass] = key.split('|');
      const bucket = (routes[route ?? 'other'] ??= {});
      bucket[statusClass ?? 'other'] = (bucket[statusClass ?? 'other'] ?? 0) + value;
    }
    return { routes, bookingSlow: this.bookingSlow };
  }

  /** Express-middleware обліку: (req, res, next) → лічильники після відповіді. */
  middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req, res, next): void => {
      // originalUrl — повний шлях незалежно від точки монтування middleware
      // (req.path у Nest forRoutes('*') буває відносним — перевірено живим прогоном).
      const path = req.originalUrl ?? req.path;
      if (path === '/metrics' || path === '/health' || path.startsWith('/telemetry')) return next();
      const route = routeBucket(path.split('?')[0] ?? path);
      const startedAt = Date.now();
      const isBooking = route === BOOKING_PREFIX;
      res.on('finish', () => {
        const code = res.statusCode;
        const statusClass =
          code >= 500
            ? '5xx'
            : code >= 400
              ? '4xx'
              : code >= 300
                ? '3xx'
                : code >= 200
                  ? '2xx'
                  : 'other';
        this.record(route, statusClass);
        if (isBooking) this.recordBookingLatency(Date.now() - startedAt);
      });
      next();
    };
  }
}
