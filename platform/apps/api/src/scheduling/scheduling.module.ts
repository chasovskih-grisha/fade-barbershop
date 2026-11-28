/* eslint-disable max-lines -- SchedulingModule is the composition root for the calendar context. */
import { Module } from '@nestjs/common';
import { NoShowStagedResponseController } from './no-show-staged-response.controller';
import { ExportController } from './infrastructure/export.controller';
import { CalendarExportController } from './infrastructure/calendar-export.controller';
import {
  NO_SHOW_STAGED_REPOSITORY,
  NoShowStagedResponseService,
} from './application/no-show-staged-response.service';
import { PrismaNoShowStagedRepository } from './infrastructure/prisma-no-show-staged.repository';
import {
  CANCELLATION_REASON_REPOSITORY,
  NoShowManagementService,
} from './application/no-show-management.service';
import { PrismaCancellationReasonRepository } from './infrastructure/prisma-cancellation-reason.repository';
import {
  DEPOSIT_HOLD_EXPIRY_SINK,
  DEPOSIT_HOLD_REPOSITORY,
  DepositHoldService,
} from './application/deposit-hold.service';
import { PrismaDepositHoldRepository } from './infrastructure/prisma-deposit-hold.repository';
import { PrismaDepositHoldExpirySink } from './infrastructure/prisma-deposit-hold-expiry.sink';
import { DepositHoldSweeper } from './infrastructure/deposit-hold-sweeper.worker';
import { DepositHoldNudgeWorker } from './infrastructure/deposit-hold-nudge.worker';
import { NudgeExpiringHolds } from './application/nudge-expiring-holds';
import { PrismaExpiringHoldNotice } from './infrastructure/prisma-expiring-hold-notice';
import { AdminCalendar } from './application/admin-calendar';
import { ListClientAppointments } from './application/list-client-appointments';
import { AdminBookingDetail } from './application/admin-booking-detail';
import { BookAgainIntentReader } from './application/book-again-intent';
import { REFERENCE_PHOTO_URLS, type ReferencePhotoUrls } from './application/reference-photo-urls';
import { HaircutAiReferencePhotoUrls } from './infrastructure/reference-photo-urls.adapter';
import { AppointmentHistoryProjection } from './infrastructure/appointment-history.projection';
import { PrismaAppointmentHistoryRepository } from './infrastructure/prisma-appointment-history.repository';
import { referencePhotoProviders } from './infrastructure/reference-photo.providers';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaSessionRepository } from '../identity/infrastructure/prisma-session-repository';
import { ClientSessionGuard } from '../identity/infrastructure/client-session.guard';
import { PrismaOutboxPublisher } from '../locations/infrastructure/prisma-locations-outbox';
import { AdminBookingsController } from './infrastructure/admin-bookings.controller';
import { adminBookingsProvider } from './infrastructure/admin-bookings.providers';
import { PrismaBookingRepository } from './infrastructure/prisma-booking.repository';
import { PrismaAvailabilityRepository } from './infrastructure/prisma-availability.repository';
import { PrismaAppointmentRepository } from './infrastructure/prisma-appointment.repository';
import { PrismaDepositPolicySettings } from './infrastructure/prisma-deposit-policy-settings';
import { PrismaLocationRepository } from '../locations/infrastructure/prisma-location.repository';
import { PrismaServiceRepository } from '../catalog/infrastructure/prisma-service.repository';
import { AdminAppointmentsController } from './infrastructure/admin-appointments.controller';
import { AdminAppointmentRescheduleController } from './infrastructure/admin-appointment-reschedule.controller';
import { AdminAppointmentReferenceController } from './infrastructure/admin-appointment-reference.controller';
import { appointmentCommandProviders } from './infrastructure/appointment-command.providers';
import { barberUnavailabilityProviders } from './infrastructure/barber-unavailability.providers';
import { MarkBarberUnavailable } from './application/mark-barber-unavailable.use-case';
import { ListShiftConflicts } from './application/list-shift-conflicts.use-case';
import { ResolveShiftConflict } from './application/resolve-shift-conflict.use-case';
import { AdminAvailabilityController } from './infrastructure/admin-availability.controller';
import { BarberAppointmentsController } from './infrastructure/barber-appointments.controller';
import { BarberScheduleController } from './infrastructure/barber-schedule.controller';
import { AdminScheduleLogController } from './infrastructure/admin-schedule-log.controller';
import { AdminCalendarController } from './infrastructure/admin-calendar.controller';
import { AdminBookingDetailController } from './infrastructure/admin-booking-detail.controller';
import { ClientAppointmentsController } from './infrastructure/client-appointments.controller';
import { ClientCancelController } from './infrastructure/client-cancel.controller';
import { ClientAppointmentListController } from './infrastructure/client-appointment-list.controller';
import { ClientBookAgainController } from './infrastructure/client-book-again.controller';
import {
  AdminScheduleChangeController,
  ClientScheduleChangeController,
} from './infrastructure/schedule-change.controller';
import {
  scheduleChangeProviders,
  scheduleSelfServiceProviders,
} from './infrastructure/schedule.providers';

@Module({
  imports: [],
  controllers: [
    NoShowStagedResponseController,
    ExportController,
    CalendarExportController,
    AdminBookingsController,
    AdminBookingDetailController,
    AdminCalendarController,
    ClientAppointmentsController,
    ClientCancelController,
    ClientAppointmentListController,
    ClientBookAgainController,
    AdminAppointmentsController,
    AdminAppointmentRescheduleController,
    AdminAppointmentReferenceController,
    AdminAvailabilityController,
    BarberAppointmentsController,
    BarberScheduleController,
    AdminScheduleLogController,
    ClientScheduleChangeController,
    AdminScheduleChangeController,
  ],
  providers: [
    PrismaService,
    PrismaSessionRepository,
    ClientSessionGuard,
    PrismaOutboxPublisher,
    NoShowStagedResponseService,
    PrismaNoShowStagedRepository,
    { provide: NO_SHOW_STAGED_REPOSITORY, useExisting: PrismaNoShowStagedRepository },
    // T-4560: durable журнал причин скасувань/no-show.
    PrismaCancellationReasonRepository,
    { provide: CANCELLATION_REASON_REPOSITORY, useExisting: PrismaCancellationReasonRepository },
    NoShowManagementService,
    // T-4619a: утримання крісла під незаплачений депозит.
    PrismaDepositHoldRepository,
    { provide: DEPOSIT_HOLD_REPOSITORY, useExisting: PrismaDepositHoldRepository },
    PrismaDepositHoldExpirySink,
    { provide: DEPOSIT_HOLD_EXPIRY_SINK, useExisting: PrismaDepositHoldExpirySink },
    DepositHoldService,
    // T-083: «Мої візити» барбера читає ту саму read-модель, що й кабінет клієнта.
    ListClientAppointments,
    // T-041/T-4619a: адмінський BookAppointment створює запис і утримання крісла.
    PrismaBookingRepository,
    PrismaAvailabilityRepository,
    PrismaAppointmentRepository,
    PrismaDepositPolicySettings,
    PrismaLocationRepository,
    PrismaServiceRepository,
    adminBookingsProvider,
    ...appointmentCommandProviders,
    // T-4616a: недоступність барбера та конфлікти по візитах.
    ...barberUnavailabilityProviders,
    // T-230: self-service графік, журнал змін і адмінський редактор.
    ...scheduleSelfServiceProviders,
    // T-4458: заявки на зміну часу, згода клієнта й перенесення.
    ...scheduleChangeProviders,
    // T-045: деталі візиту й «записатися ще раз» — порти для своїх контролерів.
    AdminBookingDetail,
    BookAgainIntentReader,
    // T-4534: история статусів візитів (projection + repository).
    PrismaAppointmentHistoryRepository,
    AppointmentHistoryProjection,
    // T-4619a: in-process тік звільняє крісла з простроченим утриманням.
    DepositHoldSweeper,
    // T-4619: нагадування за 5 хвилин до дедлайну; дублі ловить outbox.
    PrismaExpiringHoldNotice,
    {
      provide: NudgeExpiringHolds,
      useFactory: (holds: PrismaDepositHoldRepository, notices: PrismaExpiringHoldNotice) =>
        new NudgeExpiringHolds({ holds, notices }),
      inject: [DEPOSIT_HOLD_REPOSITORY, PrismaExpiringHoldNotice],
    },
    DepositHoldNudgeWorker,
    // Порт ReferencePhotoUrls — інтерфейс, тож Nest резоллює його лише через
    // явний токен (emitDecoratorMetadata стирає тип до Object).
    ...referencePhotoProviders,
    { provide: REFERENCE_PHOTO_URLS, useExisting: HaircutAiReferencePhotoUrls },
    {
      provide: AdminCalendar,
      useFactory: (prisma: PrismaService, referencePhotoUrls: ReferencePhotoUrls) =>
        new AdminCalendar({ prisma, referencePhotoUrls }),
      inject: [PrismaService, REFERENCE_PHOTO_URLS],
    },
  ],
  exports: [
    NoShowStagedResponseService,
    AdminCalendar,
    HaircutAiReferencePhotoUrls,
    NoShowManagementService,
    DepositHoldService,
    // T-4616a: use cases недоступності споживає админський контролер із PaymentModule
    // (він же тримає грошовий слід скасування), їх експортуємо.
    MarkBarberUnavailable,
    ListShiftConflicts,
    ResolveShiftConflict,
  ],
})
export class SchedulingModule {}