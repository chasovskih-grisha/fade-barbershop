// T-4464: use case «слабкі години» — тонкий шар над read-моделлю
// domain/slow-hours.ts. Джерело фактів — порт (Prisma-адаптер у
// infrastructure), час — інжектований годинник, щоб звіт був детермінованим.
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

export const SLOW_HOURS_SOURCE = Symbol('SLOW_HOURS_SOURCE');
export const SLOW_HOURS_CLOCK = Symbol('SLOW_HOURS_CLOCK');

export interface SlowHoursSource {
  /** Записи у вікні (лише ті, що займають час: без скасувань). */
  load(input: { from: Date; to: Date; locationId?: string }): Promise<OccupancyFact[]>;
}

export interface SlowHoursClock {
  now(): Date;
}

/** Некоректні параметри звіту — 400 у контролері. */
export class InvalidSlowHoursQueryError extends Error {
  constructor(detail: string) {
    super(`Invalid slow-hours query: ${detail}`);
    this.name = 'InvalidSlowHoursQueryError';
  }
}

export interface SlowHoursView {
  /** Момент читання: звіт не кешується між запитами. */
  generatedAt: string;
  locationId: string | null;
  report: SlowHoursReport;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function optionalInt(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  if (!/^\d+$/.test(raw)) throw new InvalidSlowHoursQueryError(`"${raw}" is not an integer`);
  return Number(raw);
}

/** Розбір query-параметрів у конфіг; поріг і години — конфігуруються. */
export function parseSlowHoursQuery(raw: {
  days?: string;
  thresholdPercent?: string;
  chairs?: string;
  openHour?: string;
  closeHour?: string;
  locationId?: string;
}): { config: SlowHoursConfig; locationId?: string } {
  const days = optionalInt(raw.days);
  const thresholdPercent = optionalInt(raw.thresholdPercent);
  const chairs = optionalInt(raw.chairs);
  const openHour = optionalInt(raw.openHour);
  const closeHour = optionalInt(raw.closeHour);

  const errors = validateSlowHoursParams({
    ...(days === undefined ? {} : { days }),
    ...(thresholdPercent === undefined ? {} : { thresholdPercent }),
    ...(chairs === undefined ? {} : { chairs }),
    ...(openHour === undefined ? {} : { openHour }),
    ...(closeHour === undefined ? {} : { closeHour }),
  });
  if (errors.length > 0) throw new InvalidSlowHoursQueryError(errors.join('; '));

  const locationId = raw.locationId?.trim();
  return {
    config: {
      ...SLOW_HOURS_DEFAULTS,
      ...(days === undefined ? {} : { windowDays: days }),
      ...(thresholdPercent === undefined ? {} : { thresholdPercent }),
      ...(chairs === undefined ? {} : { chairs }),
      ...(openHour === undefined ? {} : { openHour }),
      ...(closeHour === undefined ? {} : { closeHour }),
    },
    ...(locationId ? { locationId } : {}),
  };
}

@Injectable()
export class GetSlowHours {
  constructor(
    @Inject(SLOW_HOURS_SOURCE) private readonly source: SlowHoursSource,
    @Inject(SLOW_HOURS_CLOCK) private readonly clock: SlowHoursClock
  ) {}

  async handle(raw: {
    days?: string;
    thresholdPercent?: string;
    chairs?: string;
    openHour?: string;
    closeHour?: string;
    locationId?: string;
  }): Promise<SlowHoursView> {
    const { config, locationId } = parseSlowHoursQuery(raw);
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
    return { from: localDateKey(new Date(now.getTime() - config.windowDays * DAY_MS)), to: localDateKey(now) };
  }
}
