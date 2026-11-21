import { Module } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { AdminFeedbackController } from './feedback.controller';
import { AnalyzeCompetitivePositionUseCase } from '../application/analyze-competitive-position.use-case';
import { AnalyzeCompetitiveMarketGapsUseCase } from '../application/analyze-competitive-market-gaps.use-case';
import { CompetitorBenchmark } from '../domain/competitor-benchmark.entity';
import type { CompetitorBenchmarkRepository } from '../application/ports';

class InMemoryCompetitorBenchmarkRepository implements CompetitorBenchmarkRepository {
  private benchmarks: Map<string, CompetitorBenchmark[]> = new Map();

  async findByLocationId(locationId: string): Promise<CompetitorBenchmark[]> {
    if (!this.benchmarks.has(locationId)) {
      this.benchmarks.set(locationId, [
        new CompetitorBenchmark({
          id: uuidv7(),
          locationId,
          competitorName: 'Kyiv Barber Co.',
          platform: 'GOOGLE_MAPS',
          rating: 4.8,
          reviewCount: 230,
          averageHaircutPrice: 750,
          sentimentScore: 0.88,
        }),
        new CompetitorBenchmark({
          id: uuidv7(),
          locationId,
          competitorName: 'Gentlemen Club',
          platform: 'INSTAGRAM',
          rating: 4.5,
          reviewCount: 110,
          averageHaircutPrice: 900,
          sentimentScore: 0.72,
        }),
      ]);
    }
    return this.benchmarks.get(locationId) ?? [];
  }

  async save(benchmark: CompetitorBenchmark): Promise<void> {
    const list = await this.findByLocationId(benchmark.locationId);
    this.benchmarks.set(benchmark.locationId, [...list, benchmark]);
  }
}

@Module({
  controllers: [AdminFeedbackController],
  providers: [
    AnalyzeCompetitivePositionUseCase,
    AnalyzeCompetitiveMarketGapsUseCase,
    {
      provide: 'CompetitorBenchmarkRepository',
      useClass: InMemoryCompetitorBenchmarkRepository,
    },
  ],
  exports: [
    AnalyzeCompetitivePositionUseCase,
    AnalyzeCompetitiveMarketGapsUseCase,
    'CompetitorBenchmarkRepository',
  ],
})
export class FeedbackModule {}
