import { CompetitorBenchmark } from '../domain/competitor-benchmark.entity';
import { CompetitorBenchmarkRepository } from './ports';
import { AnalyzeCompetitivePositionUseCase } from './analyze-competitive-position.use-case';

class InMemoryCompetitorBenchmarkRepository implements CompetitorBenchmarkRepository {
  private benchmarks: CompetitorBenchmark[] = [];

  async findByLocationId(locationId: string): Promise<CompetitorBenchmark[]> {
    return this.benchmarks.filter(b => b.locationId === locationId);
  }

  async save(benchmark: CompetitorBenchmark): Promise<void> {
    this.benchmarks.push(benchmark);
  }
}

describe('AnalyzeCompetitivePositionUseCase', () => {
  it('should calculate market averages and competitiveness correctly', async () => {
    const repo = new InMemoryCompetitorBenchmarkRepository();
    await repo.save(new CompetitorBenchmark({
      id: 'c1',
      locationId: 'loc-1',
      competitorName: 'Sharp Cuts',
      platform: 'GOOGLE_MAPS',
      rating: 4.5,
      reviewCount: 120,
      averageHaircutPrice: 800,
      sentimentScore: 0.7,
    }));
    await repo.save(new CompetitorBenchmark({
      id: 'c2',
      locationId: 'loc-1',
      competitorName: 'Modern Fade',
      platform: 'FACEBOOK',
      rating: 4.7,
      reviewCount: 200,
      averageHaircutPrice: 1000,
      sentimentScore: 0.9,
    }));

    const useCase = new AnalyzeCompetitivePositionUseCase(repo);
    const result = await useCase.execute({
      locationId: 'loc-1',
      ourRating: 4.8,
      ourAveragePrice: 900,
    });

    expect(result.marketAverageRating).toBe(4.6);
    expect(result.marketAveragePrice).toBe(900);
    expect(result.ratingDelta).toBe(0.2);
    expect(result.priceCompetitiveness).toBe('FAIR');
    expect(result.competitorInsights).toHaveLength(2);
    expect(result.competitorInsights[0]?.isOurRatingBetter).toBe(true);
  });
});
