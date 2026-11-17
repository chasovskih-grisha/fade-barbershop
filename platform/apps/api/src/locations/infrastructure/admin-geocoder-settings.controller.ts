// AdminGeocoderSettingsController — MNG-ADM-18: перегляд і зміна провайдера
// геокодування без деплою. Охороняється глобальним AdminSessionGuard
// (APP_GUARD у IdentityModule фільтрує /admin/* крім login/me/logout).
// PUT з невалідним тілом не падає 500 — нормалізується parseGeocoderSettings.

import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaGeocoderSettings } from './prisma-geocoder-settings';
import { GoogleGeocoder } from './google-geocoder';
import { parseGeocoderSettings } from '../domain/geocoder-settings';

@ApiTags('admin-settings')
@Controller('admin/settings/geocoder')
export class AdminGeocoderSettingsController {
  constructor(
    private readonly settings: PrismaGeocoderSettings,
    private readonly google: GoogleGeocoder
  ) {}

  @Get()
  @ApiOperation({ summary: 'Поточні налаштування геокодування (MNG-ADM-18)' })
  async get() {
    const settings = await this.settings.get();
    return { ...settings, googleConfigured: this.google.configured };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Змінити провайдера геокодування без деплою' })
  async update(@Body() body: unknown) {
    // PUT приймає часткові зміни: { provider?, rateLimit?, cacheTtlMs? } —
    // мержимо з поточними, щоб адмін не змусили надсилати все.
    const current = await this.settings.get();
    const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
    const merged = parseGeocoderSettings({
      provider: raw.provider ?? current.provider,
      rateLimit: {
        max: (raw.rateLimit as { max?: unknown } | undefined)?.max ?? current.rateLimit.max,
        windowMs:
          (raw.rateLimit as { windowMs?: unknown } | undefined)?.windowMs ??
          current.rateLimit.windowMs,
      },
      cacheTtlMs: raw.cacheTtlMs ?? current.cacheTtlMs,
    });
    await this.settings.set(merged);
    return merged;
  }
}
