export interface ReviewItem {
  readonly id: string;
  readonly locationId: string;
  readonly clientId: string;
  readonly barberId?: string;
  readonly rating: number; // 1 to 5
  readonly sentimentScore: number; // -1.0 to 1.0
  readonly source: 'INTERNAL_APP' | 'GOOGLE_MAPS' | 'YELP';
  readonly comment: string;
  readonly createdAt: Date;
}

export type SentimentCategory = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export class ReviewSentiment {
  constructor(public readonly review: ReviewItem) {
    if (review.rating < 1 || review.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
  }

  public getCategory(): SentimentCategory {
    if (reviewItemIsPositive(this.review)) {
      return 'POSITIVE';
    }
    if (this.review.rating <= 2 || this.review.sentimentScore < -0.2) {
      return 'NEGATIVE';
    }
    return 'NEUTRAL';
  }
}

function reviewItemIsPositive(review: ReviewItem): boolean {
  return review.rating >= 4 || review.sentimentScore > 0.2;
}

export interface CompetitorBenchmark {
  readonly competitorName: string;
  readonly locationId: string;
  readonly averageRating: number;
  readonly totalReviews: number;
  readonly sentimentRatio: number; // positive vs negative ratio
  readonly lastCheckedAt: Date;
}
