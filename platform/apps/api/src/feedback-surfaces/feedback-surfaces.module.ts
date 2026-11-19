// T-151/T-4451: поверхні відгуків і опрацювання відгуків в одному модулі.
import { Module } from '@nestjs/common';
import { FeedbackSurfacesController } from './feedback-surfaces.controller';
import { FeedbackSurfacesService } from './feedback-surfaces.service';
import {
  InMemoryReviewProcessingRepository,
  REVIEW_PROCESSING_REPOSITORY,
  ReviewProcessingService,
} from './review-processing.service';

@Module({
  controllers: [FeedbackSurfacesController],
  providers: [
    FeedbackSurfacesService,
    ReviewProcessingService,
    {
      provide: REVIEW_PROCESSING_REPOSITORY,
      useClass: InMemoryReviewProcessingRepository,
    },
  ],
  exports: [FeedbackSurfacesService, ReviewProcessingService, REVIEW_PROCESSING_REPOSITORY],
})
export class FeedbackSurfacesModule {}
