// T-151/T-4451/T-4463: поверхні відгуків, опрацювання відгуків і закритий
// цикл (повторна оцінка + модерація вітрини) в одному модулі.
import { Module } from '@nestjs/common';
import { FeedbackSurfacesController } from './feedback-surfaces.controller';
import { FeedbackSurfacesService } from './feedback-surfaces.service';
import { REVIEW_PROCESSING_REPOSITORY, ReviewProcessingService } from './review-processing.service';
import { PrismaReviewProcessingRepository } from './infrastructure/prisma-review-processing.repository';
import {
  InMemoryReviewRevaluationRepository,
  REVIEW_REVALUATION_REPOSITORY,
  ReviewRevaluationService,
} from './review-revaluation.service';

@Module({
  controllers: [FeedbackSurfacesController],
  providers: [
    FeedbackSurfacesService,
    ReviewProcessingService,
    ReviewRevaluationService,
    {
      provide: REVIEW_PROCESSING_REPOSITORY,
      useClass: PrismaReviewProcessingRepository,
    },
    {
      // T-4463: повна історія оцінок і запитів повторної оцінки ще не має
      // колонок у схемі — стан циклу живе в пам'яті процесу.
      provide: REVIEW_REVALUATION_REPOSITORY,
      useClass: InMemoryReviewRevaluationRepository,
    },
  ],
  exports: [
    FeedbackSurfacesService,
    ReviewProcessingService,
    REVIEW_PROCESSING_REPOSITORY,
    ReviewRevaluationService,
    REVIEW_REVALUATION_REPOSITORY,
  ],
})
export class FeedbackSurfacesModule {}
