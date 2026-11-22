// T-151/T-4451/T-4463: поверхні відгуків, оптимізоване хранення стану через Prisma-адаптер
// цикл (повторна оцінка + модерація вітрини) в одному модулі.
import { Module } from '@nestjs/common';
import { FeedbackSurfacesController } from './feedback-surfaces.controller';
import { FeedbackSurfacesService } from './feedback-surfaces.service';
import { REVIEW_PROCESSING_REPOSITORY, ReviewProcessingService } from './review-processing.service';
import { PrismaReviewProcessingRepository } from './infrastructure/prisma-review-processing.repository';
import {
  PrismaReviewRevaluationRepository,
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
      provide: REVIEW_REVALUATION_REPOSITORY,
      useClass: PrismaReviewRevaluationRepository,
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
