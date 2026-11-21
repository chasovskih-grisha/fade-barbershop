// PrismaGeocoderSettings — порт GeocoderSettingsPort на AppSetting
// (MNG-ADM-18). Значення парситься й нормалізується parseGeocoderSettings:
// пошкодений/неповний JSON деградує до безпечних дефолтів, ніколи не кидає.
// Коротке кешування прочитань, щоб p99 /locations/nearest не платив за
// зайвий запит до БД, а зміна з адмінки підхоплювалась протягом секунди.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  DEFAULT_GEOCODER_SETTINGS,
  SETTING_KEY,
  parseGeocoderSettings,
  type GeocoderSettings,
  type GeocoderSettingsPort,
} from '../domain/geocoder-settings';

const READ_CACHE_MS = 1000;

@Injectable()
export class PrismaGeocoderSettings implements GeocoderSettingsPort {
  private cachedAt = 0;
  private cached: GeocoderSettings = DEFAULT_GEOCODER_SETTINGS;

  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<GeocoderSettings> {
    const t = Date.now();
    if (t - this.cachedAt < READ_CACHE_MS) return this.cached;
    try {
      const row = await this.prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
      this.cached = parseGeocoderSettings(row?.value ?? null);
    } catch {
      this.cached = DEFAULT_GEOCODER_SETTINGS; // БД тимчасово недоступна — дефолти
    }
    this.cachedAt = t;
    return this.cached;
  }

  /** Запис (адмін-ендпоінт). Валідація вхідних даних — у контролері/DTO. */
  async set(settings: GeocoderSettings): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: settings as unknown as object },
      update: { value: settings as unknown as object },
    });
    this.cached = settings;
    this.cachedAt = Date.now();
  }
}
