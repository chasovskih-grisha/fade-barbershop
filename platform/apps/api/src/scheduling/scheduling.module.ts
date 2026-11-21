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
import { DEPOSIT_HOLD_REPOSITORY, DepositHoldService } from './application/deposit-hold.service';
import { PrismaDepositHoldRepository } from './infrastructure/prisma-deposit-hold.repository';
import { DepositHoldSweeper } from './infrastructure/deposit-hold-sweeper.worker';
import { AdminCalendar } from './application/admin-calendar';
import { REFERENCE_PHOTO_URLS, type ReferencePhotoUrls } from './application/reference-photo-urls';
import { HaircutAiReferencePhotoUrls } from './infrastructure/reference-photo-urls.adapter';
import { PrismaSourcePhotoRepository } from '../haircut-ai/infrastructure/prisma-source-photo.repository';
import { S3PhotoStorage } from '../haircut-ai/infrastructure/s3-photo-storage';
import { PrismaService } from '../shared/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [NoShowStagedResponseController, ExportController],
  providers: [
    PrismaService,
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
    DepositHoldService,
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
