// MetricsExposition — чиста функція побудови експозиції Prometheus
// (text/plain; version=0.0.4). Джерело значень — ті самі лічильники, що
// показує /health. Prometheus агрегує по інстансах сам (T-4204a).
import type { GeocoderMetricName } from '../../locations/infrastructure/geocoder-metrics';
import { mobileCrashLines } from './metrics-exposition.mobile-crash';
import type { DbPoolSnapshot } from '../database/pool/pool-metrics';
import { geocoderAndPoolLines } from './metrics-exposition.geocoder-pool';

export interface MetricsExpositionInput {
  uptimeMs: number;
  nodeVersion: string;
  rssMegabytes: string;
  geocoder: Record<GeocoderMetricName, number>;
  /** Лаг outbox-реле (T-042c): null — проби немає в графі (мінімальна збірка) —
   * рядки outbox не емітяться взагалі. */
  outbox: { pending: number; oldestPendingMs: number | null } | null;
  /** Порушення rate limit (T-4410): null — IdentityModule не в графі. */
  rateLimitViolations: number | null;
  /** SLI-лічильники запитів (SLO, docs/slo.md): null — middleware не в графі. */
  http: { routes: Record<string, Record<string, number>>; bookingSlow: number } | null;
  /** RUM-лічильники Core Web Vitals (T-4204): null/відсутні — секції немає. */
  webVitals?: Record<string, Record<string, number>> | null;
  /** Краш-звіти застосунку (T-4443): null/відсутні — секції немає. */
  mobileCrash?: Record<string, Record<string, number>> | null;
  /** Пул з'єднань (T-4803): null/відсутній — секції немає (немає БД у графі). */
  dbPool?: DbPoolSnapshot | null;
  /** Memory diagnostics snapshot. */
  memory?: {
    rssBytes: number;
    heapTotalBytes: number;
    heapUsedBytes: number;
    externalBytes: number;
    heapUsagePercent: number;
  } | null;
}

// prettier-ignore
export function buildMetricsExposition(input: MetricsExpositionInput): string {
  const lines: string[] = [];
  const counter = (name: string, help: string, value: number): void => {
    lines.push('# HELP ' + name + ' ' + help);
    lines.push('# TYPE ' + name + ' counter');
    lines.push(name + ' ' + value);
  };
  const gaugeLabel = (name: string, help: string, label: string): void => {
    lines.push('# HELP ' + name + ' ' + help);
    lines.push('# TYPE ' + name + ' gauge');
    lines.push(name + '{' + label + '} 1');
  };
  const gauge = (name: string, help: string, value: string): void => {
    lines.push('# HELP ' + name + ' ' + help);
    lines.push('# TYPE ' + name + ' gauge');
    lines.push(name + ' ' + value);
  };
  counter('fade_uptime_seconds', 'Process uptime in seconds.', input.uptimeMs / 1000);
  gaugeLabel('fade_nodejs_version_info', 'Node.js version (value is always 1).', 'version="' + input.nodeVersion + '"');
  gauge('fade_process_resident_memory_megabytes', 'Resident memory in MiB.', input.rssMegabytes);
  if (input.memory) {
    gauge('fade_process_memory_rss_bytes', 'Resident Set Size memory in bytes.', String(input.memory.rssBytes));
    gauge('fade_process_memory_heap_total_bytes', 'Total heap memory in bytes.', String(input.memory.heapTotalBytes));
    gauge('fade_process_memory_heap_used_bytes', 'Used heap memory in bytes.', String(input.memory.heapUsedBytes));
    gauge('fade_process_memory_heap_usage_percent', 'Heap memory usage percentage.', String(input.memory.heapUsagePercent));
  }
  lines.push(...geocoderAndPoolLines(input));
  if (input.outbox) {
    gauge('fade_outbox_pending_messages', 'Outbox messages awaiting relay.', String(input.outbox.pending));
    if (input.outbox.oldestPendingMs !== null) {
      gauge(
        'fade_outbox_oldest_pending_seconds',
        'Age of the oldest pending outbox message.',
        String(input.outbox.oldestPendingMs / 1000)
      );
    }
  }
  if (input.rateLimitViolations !== null) {
    counter('fade_rate_limit_violations_total', 'Rate limit violations (T-4410).', input.rateLimitViolations);
  }
  if (input.http) {
    lines.push('# HELP fade_http_requests_total HTTP requests by route bucket and status class (SLO SLI, docs/slo.md).');
    lines.push('# TYPE fade_http_requests_total counter');
    for (const [route, codes] of Object.entries(input.http.routes)) {
      for (const [code, value] of Object.entries(codes)) {
        lines.push('fade_http_requests_total{route="' + route + '",code="' + code + '"} ' + value);
      }
    }
    counter('fade_http_booking_slow_total', 'Booking requests slower than 500ms (SLO SLI, docs/slo.md).', input.http.bookingSlow);
  }
  lines.push(...rumLines(input));
  return lines.join('\n') + '\n';
}

// RUM-секції (T-4204, T-4443) окремою функцією — тримає buildMetricsExposition
// під гейтом complexity.
function rumLines(input: MetricsExpositionInput): string[] {
  const out: string[] = [];
  if (input.webVitals) out.push(...webVitalsLines(input.webVitals));
  if (input.mobileCrash) out.push(...mobileCrashLines(input.mobileCrash));
  return out;
}

// RUM-секція окремою функцією: тримає складність buildMetricsExposition під гейтом.
function webVitalsLines(samples: Record<string, Record<string, number>>): string[] {
  const out: string[] = [
    '# HELP fade_web_vitals_samples_total RUM Core Web Vitals samples by metric and rating (T-4204).',
    '# TYPE fade_web_vitals_samples_total counter',
  ];
  for (const [metric, ratings] of Object.entries(samples)) {
    for (const [rating, value] of Object.entries(ratings)) {
      out.push(
        'fade_web_vitals_samples_total{metric="' + metric + '",rating="' + rating + '"} ' + value
      );
    }
  }
  return out;
}
