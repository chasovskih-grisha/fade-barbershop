// T-4445: правило блоку «рекомендуємо». Чиста логіка: жодного Nest, Prisma чи
// HTTP — вибір послуг можна перевірити без бази.

export const DEFAULT_RECOMMENDED_LIMIT = 4;
export const MAX_RECOMMENDED_LIMIT = 8;
/** Блок кешується на хвилину: головна не має рахувати топ на кожен показ. */
export const RECOMMENDED_CACHE_TTL_SECONDS = 60;

export type RecommendationMode = 'manual' | 'top-week';
export type RecommendationEventKind = 'impression' | 'click';
/** Звідки взялися позиції: ручний вибір, тижневий попит чи холодний старт. */
export type RecommendationSource = 'manual' | 'demand' | 'fallback';

export type RecommendedConfig = {
  locationId: string | null;
  mode: RecommendationMode;
  serviceIds: string[];
  limit: number;
};

export type RecommendedService = {
  id: string;
  name: string;
  duration: number;
  category: string | null;
  priceUah: number | null;
};

export type ServiceDemand = { serviceId: string; bookings: number };

export class InvalidRecommendedConfig extends Error {
  constructor(readonly reason: string) {
    super(`Invalid recommended-services config: ${reason}`);
  }
}

export class UnknownServiceInConfig extends Error {
  constructor(readonly serviceId: string) {
    super(`Service ${serviceId} is not sellable here`);
  }
}

export class UnknownRecommendedService extends Error {
  constructor(readonly serviceId: string) {
    super(`Service ${serviceId} is not sellable here`);
  }
}

export class InvalidRecommendationEvent extends Error {
  constructor(readonly kind: string) {
    super(`Unknown recommendation event ${kind || 'empty'}`);
  }
}

export const defaultRecommendedConfig = (locationId: string | null): RecommendedConfig => ({
  locationId,
  mode: 'top-week',
  serviceIds: [],
  limit: DEFAULT_RECOMMENDED_LIMIT,
});

const parseMode = (mode: string): RecommendationMode => {
  if (mode !== 'manual' && mode !== 'top-week')
    throw new InvalidRecommendedConfig(`mode ${mode || 'empty'}`);
  return mode;
};

const parseLimit = (limit: number | undefined): number => {
  const value = limit ?? DEFAULT_RECOMMENDED_LIMIT;
  if (!Number.isInteger(value) || value < 1 || value > MAX_RECOMMENDED_LIMIT)
    throw new InvalidRecommendedConfig(`limit ${value}`);
  return value;
};

const parseServiceIds = (ids: readonly string[] = []): string[] => [
  ...new Set(ids.map((id) => id.trim()).filter(Boolean)),
];

export const normalizeRecommendedConfig = (input: {
  locationId: string | null;
  mode: string;
  serviceIds?: readonly string[];
  limit?: number;
}): RecommendedConfig => {
  const mode = parseMode(input.mode);
  const limit = parseLimit(input.limit);
  const serviceIds = parseServiceIds(input.serviceIds);
  if (mode === 'manual' && serviceIds.length === 0)
    throw new InvalidRecommendedConfig('manual mode needs at least one service');
  return { locationId: input.locationId, mode, serviceIds, limit };
};

export const assertEventKind = (kind: string): RecommendationEventKind => {
  if (kind !== 'impression' && kind !== 'click') throw new InvalidRecommendationEvent(kind);
  return kind;
};

/**
 * Ручний вибір показується як задано (лише те, що справді продається в
 * локації), топ — за кількістю записів тижня; порожній попит і порожній вибір
 * → холодний старт у порядку каталогу. Дублі відкидаються, довжина ≤ limit.
 */
export const chooseRecommended = (input: {
  config: RecommendedConfig;
  demand: readonly ServiceDemand[];
  sellable: readonly RecommendedService[];
}): { ids: string[]; source: RecommendationSource } => {
  const available = new Set(input.sellable.map((service) => service.id));
  const manual = input.config.serviceIds
    .filter((id) => available.has(id))
    .slice(0, input.config.limit);
  if (input.config.mode === 'manual') return { ids: manual, source: 'manual' };

  const ranked = [...input.demand]
    .filter((row) => available.has(row.serviceId) && row.bookings > 0)
    .sort((a, b) => b.bookings - a.bookings || a.serviceId.localeCompare(b.serviceId))
    .map((row) => row.serviceId)
    .slice(0, input.config.limit);
  if (ranked.length > 0) return { ids: ranked, source: 'demand' };
  if (manual.length > 0) return { ids: manual, source: 'manual' };

  return {
    ids: input.sellable.slice(0, input.config.limit).map((service) => service.id),
    source: 'fallback',
  };
};
