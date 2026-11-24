/* eslint-disable max-lines -- SchedulingModule is the composition root for the calendar context. */
import { Module } from '@nestjs/common';
import { NoShowStagedResponseController } from './no-show-staged-response.controller';
import { ExportController } from './infrastructure/export.controller';
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
import { AdminCalendar } from './application/admin-calendar';
import { REFERENCE_PHOTO_URLS, type ReferencePhotoUrls } from './application/reference-photo-urls';
import { HaircutAiReferencePhotoUrls } from './infrastructure/reference-photo-urls.adapter';
import { PrismaSourcePhotoRepository } from '../haircut-ai/infrastructure/prisma-source-photo.repository';
import { S3PhotoStorage } from '../haircut-ai/infrastructure/s3-photo-storage';
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
import { AdminBarberUnavailabilityController } from './infrastructure/admin-barber-unavailability.controller';
import { barberUnavailabilityProviders } from './infrastructure/barber-unavailability.providers';
import { AdminAvailabilityController } from './infrastructure/admin-availability.controller';
import { BarberScheduleController } from './infrastructure/barber-schedule.controller';
import { AdminScheduleLogController } from './infrastructure/admin-schedule-log.controller';
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
    AdminBookingsController,
    AdminAppointmentsController,
    AdminAppointmentRescheduleController,
    AdminAppointmentReferenceController,
    AdminBarberUnavailabilityController,
    AdminAvailabilityController,
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
    // T-4619a: in-process тік звільняє крісла з простроченим утриманням.
    DepositHoldSweeper,
    // Порт ReferencePhotoUrls — інтерфейс, тож Nest резоллює його лише через
    // явний токен (emitDecoratorMetadata стирає тип до Object).
    PrismaSourcePhotoRepository,
    S3PhotoStorage,
    HaircutAiReferencePhotoUrls,
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
  ],
})
export class SchedulingModule {}
