export type CompetitorPlatform = 'GOOGLE_MAPS' | 'FACEBOOK' | 'INSTAGRAM' | 'OTZOVIK';

export interface CompetitorBenchmarkProps {
  id: string;
  locationId: string;
  competitorName: string;
  platform: CompetitorPlatform;
  rating: number;
  reviewCount: number;
  averageHaircutPrice: number;
  sentimentScore: number; // -1.0 to 1.0
  fetchedAt?: Date;
}

export class CompetitorBenchmark {
  public readonly id: string;
  public readonly locationId: string;
  public readonly competitorName: string;
  public readonly platform: CompetitorPlatform;
  public readonly rating: number;
  public readonly reviewCount: number;
  public readonly averageHaircutPrice: number;
  public readonly sentimentScore: number;
  public readonly fetchedAt: Date;

  constructor(props: CompetitorBenchmarkProps) {
    if (props.rating < 1.0 || props.rating > 5.0) {
      throw new Error('Competitor rating must be between 1.0 and 5.0');
    }
    if (props.reviewCount < 0) {
      throw new Error('Review count cannot be negative');
    }
    if (props.sentimentScore < -1.0 || props.sentimentScore > 1.0) {
      throw new Error('Sentiment score must be between -1.0 and 1.0');
    }

    this.id = props.id;
    this.locationId = props.locationId;
    this.competitorName = props.competitorName;
    this.platform = props.platform;
    this.rating = props.rating;
    this.reviewCount = props.reviewCount;
    this.averageHaircutPrice = props.averageHaircutPrice;
    this.sentimentScore = props.sentimentScore;
    this.fetchedAt = props.fetchedAt || new Date();
  }

  isRatingHigherThan(ourRating: number): boolean {
    return this.rating > ourRating;
  }

  priceDifferencePercent(ourAveragePrice: number): number {
    if (ourAveragePrice <= 0) return 0;
    return Number((((this.averageHaircutPrice - ourAveragePrice) / ourAveragePrice) * 100).toFixed(2));
  }
}
