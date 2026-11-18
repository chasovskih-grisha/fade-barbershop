// WebVitalsController — публічний RUM-маяк (T-4204): POST /telemetry/web-vitals.
// Без авторизації та без тіла у відповіді (204): браузер шле один семпл на
// метрику через sendBeacon. Невалідний семпл не дає 4xx — інакше галасливий
// клієнт засмічував би логи помилок на кожній сторінці.
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebVitalsMetrics } from './web-vitals-metrics';

@ApiTags('telemetry')
@Controller('telemetry')
export class WebVitalsController {
  constructor(private readonly vitals: WebVitalsMetrics) {}

  @Post('web-vitals')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'RUM-семпл Core Web Vitals (публічний маяк)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Семпл прийнято або відкинуто' })
  receive(@Body() body: unknown): void {
    this.vitals.record(body);
  }
}
