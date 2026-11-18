import { AnalyzeCompetitorGapUseCase } from './analyze-competitor-gap.use-case';
import { ReputationRepository } from './ports';
import { ReviewItem, CompetitorBenchmark } from '../domain/reputation.entity';

describe('AnalyzeCompetitorGapUseCase', () => {
  let useCase: AnalyzeCompetitorGapUseCase;
  let repoMock: jest.Mocked<ReputationRepository>;

  beforeEach(() => {
    repoMock = {
      saveReview: jest.fn(),
      listReviewsForLocation: jest.fn(),
      getCompetitorBenchmarks: jest.fn(),
      saveCompetitorBenchmark: jest.fn(),
    };
    useCase = new AnalyzeCompetitorGapUseCase(repoMock);
  });

  it('calculates competitor gap and market positioning accurately', async () => {
    const reviews: ReviewItem[] = [
      { id: 'r1', locationId: 'loc-1', clientId: 'c1', rating: 5, sentimentScore: 0.9, source: 'GOOGLE_MAPS', comment: 'Great', createdAt: new Date() },
      { id: 'r2', locationId: 'loc-1', clientId: 'c2', rating: 4, sentimentScore: 0.5, source: 'INTERNAL_APP', comment: 'Good', createdAt: new Date() },
    ];

    const benchmarks: CompetitorBenchmark[] = [
      { competitorName: 'Elite Cuts', locationId: 'loc-1', averageRating: 4.9, totalReviews: 150, sentimentRatio: 0.95, lastCheckedAt: new Date() },
      { competitorName: 'Barber Bros', locationId: 'loc-1', averageRating: 4.3, totalReviews: 80, sentimentRatio: 0.8, lastCheckedAt: new Date() },
    ];

    repoMock.listReviewsForLocation.mockResolvedValue(reviews);
    repoMock.getCompetitorBenchmarks.mockResolvedValue(benchmarks);

    const report = await useCase.execute('loc-1');

    expect(report.locationId).toBe('loc-1');
    expect(report.ourAverageRating).toBe(4.5);
    expect(report.ourTotalReviews).toBe(2);
    expect(report.topCompetitorName).toBe('Elite Cuts');
    expect(report.topCompetitorRating).toBe(4.9);
    expect(report.ratingDelta).toBe(-0.4);
    expect(report.marketPositioning).toBe('CHALLENGER');
    expect(report.strategicRecommendation).toContain('Competitive positioning');
  });
});
