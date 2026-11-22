import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './shared/health/health.module';
import { MetricsModule } from './shared/metrics/metrics.module';
import { DiagnosticsModule } from './shared/diagnostics/diagnostics.module';
import { RumModule } from './shared/rum/rum.module';
import { HttpMetrics } from './shared/metrics/http-metrics';
import { GlobalExceptionFilter } from './shared/logging/global-exception.filter';
import { IdentityModule } from './identity/infrastructure/identity.module';
import { AppointmentPartyModule } from './appointment-party/appointment-party.module';
import { LocationsModule } from './locations/infrastructure/locations.module';
import { ServicesModule } from './catalog/infrastructure/services.module';
import { ContentModule } from './content/infrastructure/content.module';
import { BookingModule } from './booking/booking.module';
import { StaffModule } from './locations/infrastructure/staff.module';
import { CrmModule } from './crm/crm.module';
import { HaircutAiModule } from './haircut-ai/infrastructure/haircut-ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ReputationModule } from './reputation/infrastructure/reputation.module';
import { FeedbackModule } from './feedback/infrastructure/feedback.module';
import { FeedbackSurfacesModule } from "./feedback-surfaces/feedback-surfaces.module";
import { PortfolioModule } from "./portfolio/infrastructure/portfolio.module";
import { SupportModule } from './support/infrastructure/support.module';
import { AnalyticsModule } from './analytics/infrastructure/analytics.module';
import { IdempotencyModule } from './shared/idempotency/idempotency.module';
import { PrivacyModule } from './identity/privacy/privacy.module';
import { RetentionModule } from './shared/retention/retention.module';
import { DbPoolModule } from './shared/database/pool/db-pool.module';
import { ArchiveModule } from './shared/archive/archive.module';
import { PricingModule } from './pricing/pricing.module';
import { AssistantsModule } from './assistants/infrastructure/assistants.module';
import { IdempotencyInterceptor } from './shared/idempotency/idempotency.interceptor';

// HTTP-middleware обліку (SLO SLI, docs/slo.md) вішаються першими — до guard'ів
// і фільтрів: рахуємо кожен запит, включно з помилками (5xx — core SLI).
@Module({
  imports: [
    HealthModule,
    MetricsModule,
    DiagnosticsModule,
    RumModule,
    IdentityModule,
    AppointmentPartyModule,
    LocationsModule,
    StaffModule,
    BookingModule,
    ServicesModule,
    ContentModule,
    CrmModule,
    HaircutAiModule,
    NotificationsModule,
    RealtimeModule,
    ReputationModule,
    FeedbackModule,
    FeedbackSurfacesModule,
    PortfolioModule,
    SupportModule,
    AnalyticsModule,
    IdempotencyModule,
    PrivacyModule,
    RetentionModule,
    DbPoolModule,
    ArchiveModule,
    PricingModule,
    AssistantsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly httpMetrics: HttpMetrics) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(this.httpMetrics.middleware()).forRoutes('*');
  }
}
