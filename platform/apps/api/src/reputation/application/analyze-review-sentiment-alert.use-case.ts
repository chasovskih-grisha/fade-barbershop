import { Injectable, Inject } from '@nestjs/common';
import type { ReputationRepository } from './ports';

export interface SentimentAlertReport {
  locationId: string;
  alertTriggered: boolean;
  negativeCount: number;
  totalReviews: number;
  recommendedAction: string;
}

@Injectable()
export class AnalyzeReviewSentimentAlertUseCase {
  constructor(
    @Inject('ReputationRepository')
    private readonly reputationRepository: ReputationRepository,
  ) {}

  public async execute(locationId: string): Promise<SentimentAlertReport> {
    const reviews = await this.reputationRepository.listReviewsForLocation(locationId);
    const negativeReviews = reviews.filter((r) => r.rating <= 2 || r.sentimentScore < -0.2);
    const alertTriggered = negativeReviews.length >= 2;

    let recommendedAction = 'No immediate action required. Reputation stability is optimal.';
    if (alertTriggered) {
      recommendedAction = 'High negative review velocity detected. Dispatch manager outreach to affected clients and review barber execution standards.';
    }

    return {
      locationId,
      alertTriggered,
      negativeCount: negativeReviews.length,
      totalReviews: reviews.length,
      recommendedAction,
    };
  }
}
