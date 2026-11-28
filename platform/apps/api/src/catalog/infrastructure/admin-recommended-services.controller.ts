// Адмінка блоку «рекомендуємо» (T-4445): ручний вибір або топ тижня, ліміт
// позицій і зріз показів/кліків, за яким вибір налаштовують.
import { Body, Controller, Get, Post, Put, Query, UseFilters } from '@nestjs/common';
import { RecommendedServicesService } from '../application/recommended-services.service';
import { RecommendedEventsService } from '../application/recommended-events.service';
import { RecommendedServicesExceptionFilter } from './recommended-services.exception-filter';

export type SaveRecommendedConfigDto = {
  locationId?: unknown;
  mode?: unknown;
  serviceIds?: unknown;
  limit?: unknown;
};

@Controller('admin/recommended-services')
@UseFilters(RecommendedServicesExceptionFilter)
export class AdminRecommendedServicesController {
  constructor(
    private readonly recommended: RecommendedServicesService,
    private readonly events: RecommendedEventsService
  ) {}

  @Get()
  config(@Query('locationId') locationId?: string) {
    return this.recommended.configFor(locationId || null);
  }

  @Put()
  save(@Body() dto: SaveRecommendedConfigDto) {
    const limit =
      dto?.limit === undefined || dto?.limit === null ? {} : { limit: Number(dto.limit) };
    return this.recommended.saveConfig({
      locationId: dto?.locationId ? String(dto.locationId) : null,
      mode: String(dto?.mode ?? ''),
      serviceIds: Array.isArray(dto?.serviceIds) ? dto.serviceIds.map(String) : [],
      ...limit,
    });
  }

  /** Скидання кешу після масової зміни цін/послуг: без нього блок живе до 60 с. */
  @Post('invalidate')
  invalidate(@Query('locationId') locationId?: string) {
    this.recommended.invalidate(locationId || null);
    return { invalidated: locationId || 'all' };
  }

  @Get('metrics')
  metrics(@Query('from') from?: string, @Query('to') to?: string) {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    return this.events.summarize({
      from: from ? new Date(from) : new Date(now - 7 * day),
      to: to ? new Date(to) : new Date(now),
    });
  }
}
