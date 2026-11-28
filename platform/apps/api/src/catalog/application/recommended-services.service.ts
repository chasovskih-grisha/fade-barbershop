// Блок «рекомендуємо» (T-4445): конфіг локації → правило → кеш на хвилину.
// Сервіс читає лише порти; S3/HTTP/Prisma живуть в адаптерах.
import { Inject, Injectable } from '@nestjs/common';
import {
  RECOMMENDED_CACHE_TTL_SECONDS,
  chooseRecommended,
  defaultRecommendedConfig,
  normalizeRecommendedConfig,
  UnknownServiceInConfig,
  type RecommendationMode,
  type RecommendationSource,
  type RecommendedConfig,
  type RecommendedService,
} from '../domain/recommended-services';
import { RECOMMENDED_PORTS, type RecommendedPorts } from './recommended-ports';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type RecommendedBlock = {
  locationId: string | null;
  mode: RecommendationMode;
  source: RecommendationSource;
  services: RecommendedService[];
  cachedUntil: Date;
};

@Injectable()
export class RecommendedServicesService {
  private readonly cache = new Map<string, { expiresAt: number; block: RecommendedBlock }>();

  constructor(@Inject(RECOMMENDED_PORTS) private readonly ports: RecommendedPorts) {}

  private get config() {
    return this.ports.config;
  }

  private get demand() {
    return this.ports.demand;
  }

  private get catalog() {
    return this.ports.catalog;
  }

  private get clock() {
    return this.ports.clock;
  }

  async block(query: { locationId?: string | null } = {}): Promise<RecommendedBlock> {
    const locationId = query.locationId ?? null;
    const now = this.clock.now();
    const key = locationId ?? '*';
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now.getTime()) return cached.block;

    const config = await this.resolveConfig(locationId);
    const sellable = await this.catalog.listSellable(locationId);
    const demand =
      config.mode === 'top-week'
        ? await this.demand.topServices({
            from: new Date(now.getTime() - WEEK_MS),
            to: now,
            locationId,
            limit: config.limit,
          })
        : [];

    const { ids, source } = chooseRecommended({ config, demand, sellable });
    const byId = new Map(sellable.map((service) => [service.id, service]));
    const block: RecommendedBlock = {
      locationId,
      mode: config.mode,
      source,
      services: ids.map((id) => byId.get(id)).filter((s): s is RecommendedService => Boolean(s)),
      cachedUntil: new Date(now.getTime() + RECOMMENDED_CACHE_TTL_SECONDS * 1000),
    };
    this.cache.set(key, { expiresAt: block.cachedUntil.getTime(), block });
    return block;
  }

  /** Свій конфіг локації, інакше мережевий дефолт, інакше вбудоване правило. */
  private async resolveConfig(locationId: string | null): Promise<RecommendedConfig> {
    const own = await this.config.find(locationId);
    if (own) return own;
    const fallback = locationId ? await this.config.find(null) : null;
    return fallback ?? defaultRecommendedConfig(locationId);
  }

  /** Збереження конфігу з адмінки: перевіряємо, що послуги справді продаються. */
  async saveConfig(input: {
    locationId: string | null;
    mode: string;
    serviceIds?: readonly string[];
    limit?: number;
  }): Promise<RecommendedConfig> {
    const normalized = normalizeRecommendedConfig(input);
    const sellable = new Set(
      (await this.catalog.listSellable(normalized.locationId)).map((s) => s.id)
    );
    for (const id of normalized.serviceIds) {
      if (!sellable.has(id)) throw new UnknownServiceInConfig(id);
    }
    const saved = await this.config.save(normalized);
    // Мережевий дефолт діє на всі локації без власного конфігу, тож його зміна
    // скидає кеш усіх локацій, а не лише ключ «*».
    this.invalidate(saved.locationId);
    return saved;
  }

  /** Скидання кешу без зміни конфігу: тик після масової зміни цін/послуг. */
  invalidate(locationId: string | null = null): void {
    if (locationId === null) this.cache.clear();
    else this.cache.delete(locationId);
  }

  configFor(locationId: string | null): Promise<RecommendedConfig | null> {
    return this.config.find(locationId);
  }
}
