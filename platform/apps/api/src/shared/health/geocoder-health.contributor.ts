// GeocoderHealthContributor — збірка геокодер-секції /health: зріз
// GeocoderMetrics + опис режиму сховищ per адаптер (nominatim/google).
// Помилки опису не ламають пробу — деградація до null (дух ADR 0050).

import { Injectable, Logger } from '@nestjs/common';
import { GeocoderMetrics } from '../../locations/infrastructure/geocoder-metrics';
import {
  GeocoderStoresFactory,
  type GeocoderStoreSetDescription,
} from '../../locations/infrastructure/geocoder-stores.factory';

/** Геокодер-секція відповіді /health: лічильники + режими сховищ. */
export interface GeocoderHealthSection {
  counters: ReturnType<GeocoderMetrics['snapshot']>;
  stores: Record<string, GeocoderStoreSetDescription> | null;
}

@Injectable()
export class GeocoderHealthContributor {
  private readonly logger = new Logger(GeocoderHealthContributor.name);

  async snapshot(
    metrics: GeocoderMetrics,
    stores: GeocoderStoresFactory
  ): Promise<GeocoderHealthSection> {
    const counters = metrics.snapshot();
    try {
      return {
        counters,
        stores: {
          nominatim: await stores.describe('nominatim'),
          google: await stores.describe('google'),
        },
      };
    } catch (error) {
      this.logger.warn(
        `geocoder health describe failed: ${error instanceof Error ? error.message : 'unknown'}`
      );
      return { counters, stores: null };
    }
  }
}
