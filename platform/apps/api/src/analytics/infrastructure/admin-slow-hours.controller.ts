// T-4464: HTTP-поверхня підказки «слабкі години» в адмінці.
// GET /admin/analytics/slow-hours?days=14&thresholdPercent=40&locationId=…
// Усі параметри опційні; некоректні → 400. Дані читаються на запит
// (read-модель), тому оновлення аналітики не блокує календар.
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  GetSlowHours,
  InvalidSlowHoursQueryError,
  type SlowHoursView,
} from '../application/get-slow-hours';

@ApiTags('admin-analytics')
@Controller('admin/analytics/slow-hours')
export class AdminSlowHoursController {
  constructor(private readonly slowHours: GetSlowHours) {}

  @Get()
  @ApiOperation({
    summary: 'Заповненість по днях/годинах, слабкі вікна й підказка дії',
  })
  @ApiQuery({ name: 'days', required: false, description: '1..60, дефолт 14' })
  @ApiQuery({ name: 'thresholdPercent', required: false, description: '1..100, дефолт 40' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'chairs', required: false, description: '1..50, дефолт 2' })
  @ApiQuery({ name: 'openHour', required: false })
  @ApiQuery({ name: 'closeHour', required: false })
  async get(
    @Query()
    query: {
      days?: string;
      thresholdPercent?: string;
      locationId?: string;
      chairs?: string;
      openHour?: string;
      closeHour?: string;
    }
  ): Promise<SlowHoursView> {
    try {
      return await this.slowHours.handle(query);
    } catch (error) {
      if (error instanceof InvalidSlowHoursQueryError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
