import { Module } from '@nestjs/common';
import { AdminReputationController } from './reputation.controller';
import { AnalyzeReviewFeedbackUseCase } from '../application/analyze-review.use-case';
import { ProcessReviewEscalationUseCase } from '../application/process-review-escalation.use-case';
import { CalculateReputationHealthUseCase } from '../application/calculate-reputation-health.use-case';
import { AnalyzeReviewSentimentAlertUseCase } from '../application/analyze-review-sentiment-alert.use-case';
import { AnalyzeCompetitorGapUseCase } from '../application/analyze-competitor-gap.use-case';
import { GenerateReviewResponseUseCase } from '../application/generate-review-response.use-case';
import type { ReputationRepository } from '../application/ports';
import type { ReviewItem, CompetitorBenchmark } from '../domain/reputation.entity';

class InMemoryReputationRepository implements ReputationRepository {
  private reviews: ReviewItem[] = [];
  private benchmarks: Map<string, CompetitorBenchmark[]> = new Map();

  async saveReview(review: ReviewItem): Promise<void> {
    this.reviews.push(review);
  }

  async listReviewsForLocation(locationId: string): Promise<ReviewItem[]> {
    return this.reviews.filter((r) => r.locationId === locationId);
  }

  async getCompetitorBenchmarks(locationId: string): Promise<CompetitorBenchmark[]> {
    return (
      this.benchmarks.get(locationId) || [
        {
          competitorName: 'Sharp & Classic Barbers',
          locationId,
          averageRating: 4.6,
          totalReviews: 142,
          sentimentRatio: 0.85,
          lastCheckedAt: new Date(),
        },
      ]
    );
  }

  async saveCompetitorBenchmark(benchmark: CompetitorBenchmark): Promise<void> {
    const list = this.benchmarks.get(benchmark.locationId) || [];
    this.benchmarks.set(benchmark.locationId, [...list, benchmark]);
  }
}

@Module({
  controllers: [AdminReputationController],
  providers: [
    AnalyzeReviewFeedbackUseCase,
    ProcessReviewEscalationUseCase,
    CalculateReputationHealthUseCase,
    AnalyzeReviewSentimentAlertUseCase,
    AnalyzeCompetitorGapUseCase,
    GenerateReviewResponseUseCase,
    {
      provide: 'ReputationRepository',
      useClass: InMemoryReputationRepository,
    },
  ],
  exports: [
    AnalyzeReviewFeedbackUseCase,
    ProcessReviewEscalationUseCase,
    CalculateReputationHealthUseCase,
    AnalyzeReviewSentimentAlertUseCase,
    AnalyzeCompetitorGapUseCase,
    GenerateReviewResponseUseCase,
    'ReputationRepository',
  ],
})
export class ReputationModule {}
