/* eslint-disable max-lines -- cohesive module (188 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4464: use case «слабкі години» — тонкий шар над read-моделлю
// domain/slow-hours.ts. Джерело фактів — порт (Prisma-адаптер у
// infrastructure), час — інжектований годинник, щоб звіт був детермінованим.
// Налаштування (поріг, години, кількість крісел) тепер читаються з AppSetting,
// щоб оператори могли змінювати їх з адмінки без передачі на кожен запит.
// Дефолтні значення використовуються, коли запис у БД ще не створений.
import { Inject, Injectable } from '@nestjs/common';
import {
  SLOW_HOURS_DEFAULTS,
  localDateKey,
  slowHoursReport,
  validateSlowHoursParams,
  type OccupancyFact,
  type SlowHoursConfig,
  type SlowHoursReport,
} from '../domain/slow-hours';
import { PrismaService } from '../../shared/prisma/prisma.service';

export const SLOW_HOURS_SETTING_KEY = 'analytics.slowHours';

/** Injection token for the slow-hours data source port. */
export const SLOW_HOURS_SOURCE = Symbol('SLOW_HOURS_SOURCE');

/** Injection token for the slow-hours clock. Uses the project clock for deterministic reports. */
export const SLOW_HOURS_CLOCK = Symbol('SLOW_HOURS_CLOCK');

/** Prisma-реалізація порту SlowHoursSource.
 *  Зчитує факти записів з бази даних Prisma (model OccupancyFact).
 *  Фільтрює за датою, годин та локацією.
 */
@Injectable()
export class PrismaSlowHoursSource {
  constructor(private readonly prisma: PrismaService) {}

  async load(input: { from: Date; to: Date; locationId?: string }): Promise<OccupancyFact[]> {
    const { from, to, locationId } = input;

    const where: any = {
      AND: [{ start: { gte: from } }, { end: { lte: to } }],
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const facts = await this.prisma.occupancyFact.findMany({
      where,
      orderBy: { start: 'asc' },
    });

    // Convert to our domain type (omit Prisma-internal fields)
    return facts.map((fact) => ({
      start: fact.start,
      end: fact.end,
    }));
  }
}

/** Injection token for the slow-hours settings service. */
export const SLOW_HOURS_SETTINGS = Symbol('SLOW_HOURS_SETTINGS');

@Injectable()
export class PrismaSlowHoursSettings {
  private cachedAt = 0;
  private cached: SlowHoursConfig = SLOW_HOURS_DEFAULTS;

  constructor(private readonly prisma: PrismaService = new PrismaService()) {}

  async get(): Promise<SlowHoursConfig> {
    await this.refresh();
    return this.cached;
  }

  private async refresh(): Promise<void> {
    const now = Date.now();
    if (now - this.cachedAt < 1000) return; // 1s cache
    try {
      const row = await this.prisma.appSetting.findUnique({
        where: { key: SLOW_HOURS_SETTING_KEY },
      });
      if (row?.value) {
        // Parse the JSON value back to SlowHoursConfig
        const parsed: Partial<SlowHoursConfig> = JSON.parse(row.value as string);
        this.cached = { ...SLOW_HOURS_DEFAULTS, ...parsed };
      } else {
        this.cached = SLOW_HOURS_DEFAULTS;
      }
    } catch {
      this.cached = SLOW_HOURS_DEFAULTS;
    }
    this.cachedAt = now;
  }
}

/** Некоректні параметри звіту — 400 у контролері. */
export class InvalidSlowHoursQueryError extends Error {
  constructor(detail: string) {
    super(`Invalid slow-hours query: ${detail}`);
    this.name = 'InvalidSlowHoursQueryError';
  }
}

/** Результат виклику use case. */
export interface SlowHoursView {
  /** Момент читання: звіт не кешується між запитами. */
  generatedAt: string;
  locationId: string | null;
  report: SlowHoursReport;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Розбір query-параметрів у конфіг з перевіркою AppSetting.
 *  Якщо параметр не надано в запиті — читаємо з AppSetting,
 *  а якщо й там немає — використовуємо дефолт.
 */
export function parseSlowHoursQuery(
  raw: {
    days?: string;
    thresholdPercent?: string;
    chairs?: string;
    openHour?: string;
    closeHour?: string;
    locationId?: string;
  },
  settings?: SlowHoursConfig
): { config: SlowHoursConfig; locationId?: string } {
  const defaultSettings: SlowHoursConfig = {
    windowDays: SLOW_HOURS_DEFAULTS.windowDays,
    thresholdPercent: SLOW_HOURS_DEFAULTS.thresholdPercent,
    chairs: SLOW_HOURS_DEFAULTS.chairs,
    openHour: SLOW_HOURS_DEFAULTS.openHour,
    closeHour: SLOW_HOURS_DEFAULTS.closeHour,
    timeZone: SLOW_HOURS_DEFAULTS.timeZone,
  };
  const settingsToUse = settings ?? defaultSettings;
  const days = raw.days !== undefined ? Number(raw.days) : settingsToUse.windowDays;
  const thresholdPercent =
    raw.thresholdPercent !== undefined
      ? Number(raw.thresholdPercent)
      : settingsToUse.thresholdPercent;
  const chairs = raw.chairs !== undefined ? Number(raw.chairs) : settingsToUse.chairs;
  const openHour = raw.openHour !== undefined ? Number(raw.openHour) : settingsToUse.openHour;
  const closeHour = raw.closeHour !== undefined ? Number(raw.closeHour) : settingsToUse.closeHour;

  const errors = validateSlowHoursParams({
    days,
    thresholdPercent,
    chairs,
    openHour,
    closeHour,
  });
  if (errors.length > 0) throw new InvalidSlowHoursQueryError(errors.join('; '));

  const locationId = raw.locationId?.trim();

  return {
    config: {
      windowDays: days,
      thresholdPercent,
      openHour,
      closeHour,
      chairs,
      timeZone: SLOW_HOURS_DEFAULTS.timeZone,
    },
    ...(locationId ? { locationId } : {}),
  };
}

/** Джерело фактів — порт (Prisma-адаптер у infrastructure). */
export interface SlowHoursSource {
  /** Записи у вікні (лише ті, що займають час: без скасувань). */
  load(input: { from: Date; to: Date; locationId?: string }): Promise<OccupancyFact[]>;
}

/** Інтерфейс годинника для детермінованих звітів. */
export interface SlowHoursClock {
  now(): Date;
}

/** Некоректні параметри звіту — 400 у контролері. */
export class InvalidSlowHoursQueryErrorExt extends Error {
  constructor(detail: string) {
    super(`Invalid slow-hours query: ${detail}`);
    this.name = 'InvalidSlowHoursQueryErrorExt';
  }
}

/** Результат виклику use case. */
export interface SlowHoursViewExt {
  /** Момент читання: звіт не кешується між запитами. */
  generatedAt: string;
  locationId: string | null;
  report: SlowHoursReport;
}

/** Use case для отримання звіту «слабкі години». */
@Injectable()
export class GetSlowHours {
  constructor(
    @Inject(SLOW_HOURS_SOURCE) private readonly source: SlowHoursSource,
    @Inject(SLOW_HOURS_CLOCK) private readonly clock: SlowHoursClock,
    private readonly slowHoursSettings?: PrismaSlowHoursSettings
  ) {}

  async handle(raw: {
    days?: string;
    thresholdPercent?: string;
    chairs?: string;
    openHour?: string;
    closeHour?: string;
    locationId?: string;
  }): Promise<SlowHoursView> {
    const settings = (await this.slowHoursSettings?.get()) ?? {
      windowDays: SLOW_HOURS_DEFAULTS.windowDays,
      thresholdPercent: SLOW_HOURS_DEFAULTS.thresholdPercent,
      chairs: SLOW_HOURS_DEFAULTS.chairs,
      openHour: SLOW_HOURS_DEFAULTS.openHour,
      closeHour: SLOW_HOURS_DEFAULTS.closeHour,
      timeZone: SLOW_HOURS_DEFAULTS.timeZone,
    };
    const { config, locationId } = parseSlowHoursQuery(raw, settings);
    const now = this.clock.now();
    const from = new Date(now.getTime() - config.windowDays * DAY_MS);

    const facts = await this.source.load({
      from,
      to: now,
      ...(locationId ? { locationId } : {}),
    });

    return {
      generatedAt: now.toISOString(),
      locationId: locationId ?? null,
      report: slowHoursReport(facts, now, config),
    };
  }

  /** Мітки періоду для логів/аудиту — той самий годинник, без Date.now(). */
  periodLabels(raw: { days?: string }): { from: string; to: string } {
    const { config } = parseSlowHoursQuery(raw);
    const now = this.clock.now();
    return {
      from: localDateKey(new Date(now.getTime() - config.windowDays * DAY_MS)),
      to: localDateKey(now),
    };
  }
}
