// T-151/T-4451/T-4463: поверхні відгуків, опрацювання відгуків і закритий
// цикл (повторна оцінка + модерація вітрини) в одному модулі.
import { Module } from '@nestjs/common';
import { FeedbackSurfacesController } from './feedback-surfaces.controller';
import { FeedbackSurfacesService } from './feedback-surfaces.service';
import {
  InMemoryReviewProcessingRepository,
  REVIEW_PROCESSING_REPOSITORY,
  ReviewProcessingService,
} from './review-processing.service';
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
      useClass: InMemoryReviewProcessingRepository,
    },
    {
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
