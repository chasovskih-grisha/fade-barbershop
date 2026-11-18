// MobileCrashController — публічний краш-маяк застосунку (T-4443):
// POST /telemetry/mobile-crash. Без авторизації та без тіла у відповіді (204):
// застосунок шле один мінімальний звіт. Невалідний семпл не дає 4xx — інакше
// краш-коридор на кожному падінні засмічував би логи помилок.
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MobileCrashMetrics } from './mobile-crash-metrics';

@ApiTags('telemetry')
@Controller('telemetry')
export class MobileCrashController {
  constructor(private readonly crashes: MobileCrashMetrics) {}

  @Post('mobile-crash')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Краш-звіт застосунку (публічний маяк, без PII)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Звіт прийнято або відкинуто' })
  receive(@Body() body: unknown): void {
    this.crashes.record(body);
  }
}
