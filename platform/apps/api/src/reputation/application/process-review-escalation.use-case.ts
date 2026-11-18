import { ReviewItem } from '../domain/reputation.entity';
import { ReviewResponseTemplate, ReviewSentimentType } from '../domain/review-response.value-object';

export interface AdminNotifier {
  notifyNegativeEscalation(review: ReviewItem): Promise<void>;
}

export class ProcessReviewEscalationUseCase {
  constructor(private readonly adminNotifier?: AdminNotifier) {}

  public async execute(review: ReviewItem): Promise<{
    sentiment: ReviewSentimentType;
    autoResponse: string;
    escalatedToAdmin: boolean;
  }> {
    let sentiment: ReviewSentimentType = 'NEUTRAL';
    if (review.rating >= 4 || review.sentimentScore > 0.2) {
      sentiment = 'POSITIVE';
    } else if (review.rating <= 2 || review.sentimentScore < -0.2) {
      sentiment = 'NEGATIVE';
    }

    const autoResponse = ReviewResponseTemplate.getTemplate(sentiment, 'Client');
    const escalatedToAdmin = ReviewResponseTemplate.shouldEscalateToAdmin(review.rating, review.sentimentScore);

    if (escalatedToAdmin && this.adminNotifier) {
      await this.adminNotifier.notifyNegativeEscalation(review);
    }

    return { sentiment, autoResponse, escalatedToAdmin };
  }
}
