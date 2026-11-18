import { Injectable, Inject } from '@nestjs/common';
import type { ReputationRepository } from './ports';

export interface CompetitorGapReport {
  readonly locationId: string;
  readonly ourAverageRating: number;
  readonly ourTotalReviews: number;
  readonly topCompetitorName: string;
  readonly topCompetitorRating: number;
  readonly ratingDelta: number; // ourAverageRating - topCompetitorRating
  readonly volumeSharePercentage: number; // our reviews vs total market reviews
  readonly marketPositioning: 'MARKET_LEADER' | 'STRONG_CONTENDER' | 'CHALLENGER' | 'LAGGARD';
  readonly strategicRecommendation: string;
}

@Injectable()
export class AnalyzeCompetitorGapUseCase {
  constructor(
    @Inject('ReputationRepository')
    private readonly reputationRepository: ReputationRepository,
  ) {}

  public async execute(locationId: string): Promise<CompetitorGapReport> {
    const reviews = await this.reputationRepository.listReviewsForLocation(locationId);
    const benchmarks = await this.reputationRepository.getCompetitorBenchmarks(locationId);

    const ourTotalReviews = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const ourAverageRating = ourTotalReviews === 0 ? 5.0 : Number((ratingSum / ourTotalReviews).toFixed(2));

    const totalMarketReviews = ourTotalReviews + benchmarks.reduce((sum, b) => sum + b.totalReviews, 0);
    const volumeSharePercentage = totalMarketReviews === 0 ? 100 : Number(((ourTotalReviews / totalMarketReviews) * 100).toFixed(1));

    let topCompetitorName = 'None';
    let topCompetitorRating = 0;

    if (benchmarks.length > 0 && benchmarks[0]) {
      const sortedCompetitors = [...benchmarks].sort((a, b) => b.averageRating - a.averageRating);
      if (sortedCompetitors[0]) {
        topCompetitorName = sortedCompetitors[0].competitorName;
        topCompetitorRating = sortedCompetitors[0].averageRating;
      }
    }

    const ratingDelta = Number((ourAverageRating - topCompetitorRating).toFixed(2));

    let marketPositioning: 'MARKET_LEADER' | 'STRONG_CONTENDER' | 'CHALLENGER' | 'LAGGARD' = 'STRONG_CONTENDER';
    if (ratingDelta >= 0 && (benchmarks.length === 0 || ourAverageRating >= topCompetitorRating)) {
      marketPositioning = 'MARKET_LEADER';
    } else if (ratingDelta >= -0.2) {
      marketPositioning = 'STRONG_CONTENDER';
    } else if (ratingDelta >= -0.5) {
      marketPositioning = 'CHALLENGER';
    } else {
      marketPositioning = 'LAGGARD';
    }

    let strategicRecommendation = 'Maintain local search leadership and encourage ongoing review submissions.';
    if (marketPositioning === 'LAGGARD') {
      strategicRecommendation = 'Significant rating gap behind top competitor. Audit quality control, chair service times, and staff training immediately.';
    } else if (marketPositioning === 'CHALLENGER') {
      strategicRecommendation = 'Competitive positioning is solid but trailing top local shops. Boost post-visit SMS review requests to close volume gap.';
    } else if (marketPositioning === 'STRONG_CONTENDER') {
      strategicRecommendation = 'Neck-and-neck with local market leaders. Focus on unique service differentiators and rapid review response times.';
    }

    return {
      locationId,
      ourAverageRating,
      ourTotalReviews,
      topCompetitorName,
      topCompetitorRating,
      ratingDelta,
      volumeSharePercentage,
      marketPositioning,
      strategicRecommendation,
    };
  }
}
