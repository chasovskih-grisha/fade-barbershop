// Токени і типи залежностей /health (відокремлені за ADR 0019 — LOC-гейт).
import type { GeocoderMetrics } from '../../locations/infrastructure/geocoder-metrics';
import type { GeocoderStoresFactory } from '../../locations/infrastructure/geocoder-stores.factory';
import type { GeocoderHealthContributor } from './geocoder-health.contributor';
import type { OutboxHealthContributor } from './outbox-health.contributor';
import type { MemoryHealthContributor } from './memory-health.contributor';
import type { DatabaseHealthContributor } from './database-health.contributor';

/** Токен зібраних залежностей /health (провайдер у HealthModule). */
export const HEALTH_IO = Symbol('HEALTH_IO');

export interface HealthDeps {
  metrics: GeocoderMetrics;
  stores: GeocoderStoresFactory;
  geocoderHealth: GeocoderHealthContributor;
  outboxHealth: OutboxHealthContributor;
  memoryHealth: MemoryHealthContributor;
  databaseHealth: DatabaseHealthContributor;
}
