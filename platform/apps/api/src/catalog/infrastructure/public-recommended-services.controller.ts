// Публічний блок «рекомендуємо» (T-4445): головна веба і кабінет читають той
// самий payload, а показ/клік рахуються для налаштування вибору.
import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import { RecommendedServicesService } from '../application/recommended-services.service';
import { RecommendedEventsService } from '../application/recommended-events.service';
import { RecommendedServicesExceptionFilter } from './recommended-services.exception-filter';

export type RecommendationEventDto = {
  serviceId?: unknown;
  kind?: unknown;
  locationId?: unknown;
};

@Controller('public/recommended-services')
@UseFilters(RecommendedServicesExceptionFilter)
export class PublicRecommendedServicesController {
  constructor(
    private readonly recommended: RecommendedServicesService,
    private readonly events: RecommendedEventsService
  ) {}

  @Get()
  block(@Query('locationId') locationId?: string) {
    return this.recommended.block({ locationId: locationId || null });
  }

  @Post('events')
  record(@Body() dto: RecommendationEventDto) {
    return this.events.record({
      serviceId: String(dto?.serviceId ?? ''),
      kind: String(dto?.kind ?? ''),
      locationId: dto?.locationId ? String(dto.locationId) : null,
    });
  }
}
