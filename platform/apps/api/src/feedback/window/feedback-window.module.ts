// Композиційний корінь вікон відгуку (T-150): сервіс, Prisma-адаптер і дві
// HTTP-поверхні — клієнтська (сесія клієнта) та внутрішня (`/admin/`).
import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaFeedbackWindowRepository } from './infrastructure/prisma-feedback-window.repository';
import { ClientFeedbackWindowController } from './infrastructure/client-feedback-window.controller';
import { AdminFeedbackWindowController } from './infrastructure/admin-feedback-window.controller';
import { FeedbackWindowService } from './application/feedback-window.service';
import { FeedbackPhotoService } from './application/feedback-photo.service';
import { FeedbackPhotoRemovalService } from './application/feedback-photo-removal.service';
import { S3FeedbackPhotoStorage } from './infrastructure/s3-feedback-photo-storage';
import { ClientFeedbackPhotoController } from './infrastructure/client-feedback-photo.controller';
import { FEEDBACK_WINDOWS } from './application/ports';
import { FEEDBACK_PHOTOS } from './application/photo-port';

@Module({
  controllers: [
    ClientFeedbackWindowController,
    ClientFeedbackPhotoController,
    AdminFeedbackWindowController,
  ],
  providers: [
    FeedbackWindowService,
    FeedbackPhotoService,
    FeedbackPhotoRemovalService,
    S3FeedbackPhotoStorage,
    PrismaService,
    PrismaFeedbackWindowRepository,
    { provide: FEEDBACK_WINDOWS, useExisting: PrismaFeedbackWindowRepository },
    { provide: FEEDBACK_PHOTOS, useExisting: S3FeedbackPhotoStorage },
  ],
  exports: [FeedbackWindowService, FeedbackPhotoService, FeedbackPhotoRemovalService],
})
export class FeedbackWindowModule {}
