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
import {
  AMPLITUDE_STORE,
  AMPLITUDE_TRANSPORT,
  type AmplitudeTransport,
} from '../application/amplitude.ports';
import { ForwardAnalyticsEvents } from '../application/forward-analytics-events';
import { AmplitudeHttpTransport } from './amplitude-http.transport';
import { PrismaAmplitudeStore } from './prisma-amplitude.store';
import { AnalyticsForwardingWorker } from './analytics-forwarding.worker';
import { PrismaBookingSourceStats } from './prisma-booking-source.stats';
import { BookingSourceController } from './booking-source.controller';
import {
  GetBookingSourceBreakdown,
  BOOKING_SOURCE_STATS,
} from '../application/booking-source-breakdown';

const analyticsLogger = new Logger('AnalyticsForwarding');

@Module({
  imports: [MetricsModule],
  controllers: [AdminLaunchDashboardController, BookingSourceController],
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
        if (!apiKey)
          return {
            send: async () => {
              throw new Error('AMPLITUDE_API_KEY is not configured');
            },
          };
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
  ],
  exports: [GetLaunchDashboard],
})
export class AnalyticsModule {}
