import { AnalyzeCompetitiveMarketGapsUseCase } from './analyze-competitive-market-gaps.use-case';
import { CompetitorBenchmark } from '../domain/competitor-benchmark.entity';
import type { CompetitorBenchmarkRepository } from './ports';

describe('AnalyzeCompetitiveMarketGapsUseCase', () => {
  let useCase: AnalyzeCompetitiveMarketGapsUseCase;
  let mockRepo: jest.Mocked<CompetitorBenchmarkRepository>;

  beforeEach(() => {
    mockRepo = {
      findByLocationId: jest.fn(),
      save: jest.fn(),
    };
    useCase = new AnalyzeCompetitiveMarketGapsUseCase(mockRepo);
  });

  it('analyzes market gaps and detects high SEO threat when review count is low', async () => {
    mockRepo.findByLocationId.mockResolvedValue([
      new CompetitorBenchmark({
        id: 'comp-1',
        locationId: 'loc-1',
        competitorName: 'Alpha Cuts',
        platform: 'GOOGLE_MAPS',
        rating: 4.8,
        reviewCount: 300,
        averageHaircutPrice: 35,
        sentimentScore: 0.8,
      }),
    ]);

    const result = await useCase.execute({
      locationId: 'loc-1',
      ourRating: 4.7,
      ourAveragePrice: 35,
      ourReviewCount: 40,
    });

    expect(result.seoThreatLevel).toBe('HIGH');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.competitorGaps[0]?.threatAssessment).toBe('STRONG_RIVAL');
  });
});
