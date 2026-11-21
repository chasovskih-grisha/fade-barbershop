// GET /admin/analytics/booking-sources?from&to (T-4536): розподіл записів за
// каналом. Сторож — глобальний AdminSessionGuard (як решта /admin/*).
import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetBookingSourceBreakdown } from '../application/booking-source-breakdown';

const DEFAULT_WINDOW_DAYS = 30;

function parseDate(raw: string | undefined, fallback: Date): Date {
  if (!raw) return fallback;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : fallback;
}

@ApiTags('admin-analytics')
@Controller('admin/analytics')
export class BookingSourceController {
  constructor(private readonly breakdown: GetBookingSourceBreakdown) {}

  @Get('booking-sources')
  @ApiOperation({ summary: 'Розподіл записів за каналом створення (T-4536)' })
  async sources(
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<ReturnType<GetBookingSourceBreakdown['handle']>> {
    const now = new Date();
    const since = new Date(now.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    try {
      return await this.breakdown.handle(parseDate(from, since), parseDate(to, now));
    } catch (error) {
      if (error instanceof RangeError)
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      throw error;
    }
  }
}
