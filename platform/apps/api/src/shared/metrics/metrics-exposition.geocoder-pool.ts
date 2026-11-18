// Геокодер + пул з'єднань (T-4803) — окремий файл, щоб
// metrics-exposition.ts лишався під гейтом max-lines/max-statements.
import { dbPoolExpositionLines } from '../database/pool/pool-metrics';
import type { MetricsExpositionInput } from './metrics-exposition';

export function geocoderAndPoolLines(input: MetricsExpositionInput): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(input.geocoder)) {
    out.push('# HELP fade_geocoder_' + key + ' Geocoder counter: ' + key + '.');
    out.push('# TYPE fade_geocoder_' + key + ' counter');
    out.push('fade_geocoder_' + key + ' ' + value);
  }
  out.push(...dbPoolExpositionLines(input.dbPool ?? null));
  return out;
}
