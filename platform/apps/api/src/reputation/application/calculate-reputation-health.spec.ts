import { CalculateReputationHealthUseCase } from './calculate-reputation-health.use-case';
import { ReputationRepository } from './ports';
import { ReviewItem, CompetitorBenchmark } from '../domain/reputation.entity';

class MockReputationRepo implements ReputationRepository {
  private reviews: ReviewItem[] = [
    {
      id: 'r-1',
      locationId: 'loc-1',
      clientId: 'c-1',
      rating: 5,
      sentimentScore: 0.9,
      source: 'INTERNAL_APP',
      comment: 'Great',
      createdAt: new Date(),
    },
    {
      id: 'r-2',
      locationId: 'loc-1',
      clientId: 'c-2',
      rating: 1,
      sentimentScore: -0.9,
      source: 'INTERNAL_APP',
      comment: 'Bad',
      createdAt: new Date(),
    },
  ];

  private benchmarks: CompetitorBenchmark[] = [
    {
      competitorName: 'Rival Barbers',
      locationId: 'loc-1',
      averageRating: 4.8,
      totalReviews: 200,
      sentimentRatio: 0.9,
      lastCheckedAt: new Date(),
    },
  ];

  async saveReview(review: ReviewItem): Promise<void> {
    this.reviews.push(review);
  }

  async listReviewsForLocation(locationId: string): Promise<ReviewItem[]> {
    return this.reviews.filter(r => r.locationId === locationId);
  }

  async getCompetitorBenchmarks(locationId: string): Promise<CompetitorBenchmark[]> {
    return this.benchmarks.filter(b => b.locationId === locationId);
  }

  async saveCompetitorBenchmark(benchmark: CompetitorBenchmark): Promise<void> {
    this.benchmarks.push(benchmark);
  }
}

describe('CalculateReputationHealthUseCase', () => {
  it('calculates reputation health, sentiment breakdown, risk status and competitive rank', async () => {
    const repo = new MockReputationRepo();
    const useCase = new CalculateReputationHealthUseCase(repo);

    const report = await useCase.execute('loc-1');
    expect(report.totalReviews).toBe(2);
    expect(report.averageRating).toBe(3.0);
    expect(report.riskStatus).toBe('HIGH_RISK');
    expect(report.sentimentBreakdown.positive).toBe(1);
    expect(report.sentimentBreakdown.negative).toBe(1);
    expect(report.competitiveRank).toBe(2); // Rival Barbers is 4.8, we are 3.0 (rank 2 out of 2)
    expect(report.actionableInsight).toContain('High negative review ratio detected');
  });
});
