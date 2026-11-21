import { Injectable, Inject } from '@nestjs/common';
import { ReviewItem } from '../domain/reputation.entity';
import type { ReputationRepository } from './ports';

@Injectable()
export class AnalyzeReviewFeedbackUseCase {
  constructor(
    @Inject('ReputationRepository')
    private readonly reputationRepository: ReputationRepository
  ) {}

  public async execute(review: ReviewItem): Promise<{ sentiment: string; npsScore: number }> {
    await this.reputationRepository.saveReview(review);
    const allReviews = await this.reputationRepository.listReviewsForLocation(review.locationId);

    let promoters = 0;
    let detractors = 0;
    for (const r of allReviews) {
      if (r.rating === 5) promoters++;
      else if (r.rating <= 3) detractors++;
    }
    const npsScore =
      allReviews.length === 0
        ? 0
        : Math.round(((promoters - detractors) / allReviews.length) * 100);

    let sentiment = 'NEUTRAL';
    if (review.rating >= 4 || review.sentimentScore > 0.2) sentiment = 'POSITIVE';
    else if (review.rating <= 2 || review.sentimentScore < -0.2) sentiment = 'NEGATIVE';

    return { sentiment, npsScore };
  }
}
