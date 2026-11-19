// AnalyticsModule (T-4439): read-model дашборда запуску. PrismaService
// реєструється локально — спільного @Global PrismaModule немає (патерн
// content/realtime), HttpMetrics приходить із MetricsModule (той самий
// інстанс, що лічить для /metrics).
import { Logger, Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MetricsModule } from '../../shared/metrics/metrics.module';
import { AdminLaunchDashboardController } from './admin-launch-dashboard.controller';
import { PrismaLaunchMetricsSource } from './prisma-launch-metrics.source';
import { GetLaunchDashboard } from '../application/get-launch-dashboard';
import { LAUNCH_METRICS_SOURCE } from '../application/launch-dashboard.ports';
import { AMPLITUDE_STORE, AMPLITUDE_TRANSPORT, type AmplitudeTransport } from '../application/amplitude.ports';
import { ForwardAnalyticsEvents } from '../application/forward-analytics-events';
import { AmplitudeHttpTransport } from './amplitude-http.transport';
import { PrismaAmplitudeStore } from './prisma-amplitude.store';
import { AnalyticsForwardingWorker } from './analytics-forwarding.worker';
import { PrismaBookingSourceStats } from './prisma-booking-source.stats';
import { BookingSourceController } from './booking-source.controller';
import { GetBookingSourceBreakdown, BOOKING_SOURCE_STATS } from '../application/booking-source-breakdown';
import { AdminSlowHoursController } from './admin-slow-hours.controller';
import { PrismaSlowHoursSource } from './prisma-slow-hours.source';
import {
  GetSlowHours,
  SLOW_HOURS_CLOCK,
  SLOW_HOURS_SOURCE,
  type SlowHoursClock,
} from '../application/get-slow-hours';

const analyticsLogger = new Logger('AnalyticsForwarding');

@Module({
  imports: [MetricsModule],
  controllers: [AdminLaunchDashboardController, BookingSourceController, AdminSlowHoursController],
  providers: [
    PrismaService,
    PrismaLaunchMetricsSource,
    { provide: LAUNCH_METRICS_SOURCE, useExisting: PrismaLaunchMetricsSource },
    GetLaunchDashboard,
    PrismaAmplitudeStore,
    { provide: AMPLITUDE_STORE, useExisting: PrismaAmplitudeStore },
    {
      provide: AMPLITUDE_TRANSPORT,
      useFactory: (): AmplitudeTransport => {
        const apiKey = process.env.AMPLITUDE_API_KEY;
        // Без ключа лишаємо явну відмову: краще помилка в аудиті, ніж тихе
        // «нічого не надіслано» (воркер узагалі не стартує без ключа).
        if (!apiKey) return { send: async () => { throw new Error('AMPLITUDE_API_KEY is not configured'); } };
        return new AmplitudeHttpTransport(apiKey);
      },
    },
    {
      provide: ForwardAnalyticsEvents,
      useFactory: (store, transport) =>
        new ForwardAnalyticsEvents({
          store,
          transport,
          audit: (event) => analyticsLogger.log(JSON.stringify(event)),
        }),
      inject: [AMPLITUDE_STORE, AMPLITUDE_TRANSPORT],
    },
    AnalyticsForwardingWorker,
    PrismaBookingSourceStats,
    { provide: BOOKING_SOURCE_STATS, useExisting: PrismaBookingSourceStats },
    {
      provide: GetBookingSourceBreakdown,
      useFactory: (stats) => new GetBookingSourceBreakdown(stats),
      inject: [BOOKING_SOURCE_STATS],
    },
    // T-4464: «слабкі години» — поріг і години конфігуруються, час інжектується.
    PrismaSlowHoursSource,
    { provide: SLOW_HOURS_SOURCE, useExisting: PrismaSlowHoursSource },
    { provide: SLOW_HOURS_CLOCK, useFactory: (): SlowHoursClock => ({ now: () => new Date() }) },
    {
      provide: GetSlowHours,
      useFactory: (source, clock) => new GetSlowHours(source, clock),
      inject: [SLOW_HOURS_SOURCE, SLOW_HOURS_CLOCK],
    },
  ],
  exports: [GetLaunchDashboard, GetSlowHours],
})
export class AnalyticsModule {}
