import { ReviewItem, CompetitorBenchmark } from '../domain/reputation.entity';

export interface ReputationRepository {
  saveReview(review: ReviewItem): Promise<void>;
  listReviewsForLocation(locationId: string): Promise<ReviewItem[]>;
  getCompetitorBenchmarks(locationId: string): Promise<CompetitorBenchmark[]>;
  saveCompetitorBenchmark(benchmark: CompetitorBenchmark): Promise<void>;
}
