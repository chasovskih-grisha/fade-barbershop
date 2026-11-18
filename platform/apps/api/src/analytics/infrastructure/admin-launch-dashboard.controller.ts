// HTTP-поверхня дашборда запуску (T-4439): GET /admin/analytics/launch.
// `days` — 1..30, дефолт 7 (перші дні після відкриття).
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetLaunchDashboard, type LaunchDashboardView } from '../application/get-launch-dashboard';

@ApiTags('admin-analytics')
@Controller('admin/analytics/launch')
export class AdminLaunchDashboardController {
  constructor(private readonly dashboard: GetLaunchDashboard) {}

  @Get()
  @ApiOperation({ summary: 'Таблиці запуску: перші 7 днів і гейти доставки/5xx' })
  get(@Query('days') days?: string): Promise<LaunchDashboardView> {
    // exactOptionalPropertyTypes: відсутній `days` — це {}, а не { days: undefined }.
    return this.dashboard.handle(days === undefined ? {} : { days: Number(days) });
  }
}
