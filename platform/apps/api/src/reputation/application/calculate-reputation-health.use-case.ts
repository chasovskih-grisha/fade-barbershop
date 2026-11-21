/* eslint-disable complexity -- 1 function with inherent domain branching (worst: an existing definition, complexity 13 vs 10); refactor tracked in T-2500f */
import { Injectable, Inject } from '@nestjs/common';
import { ReviewSentiment } from '../domain/reputation.entity';
import type { ReputationRepository } from './ports';

export interface ReputationHealthReport {
  readonly locationId: string;
  readonly totalReviews: number;
  readonly averageRating: number;
  readonly sentimentBreakdown: {
    readonly positive: number;
    readonly neutral: number;
    readonly negative: number;
  };
  readonly riskStatus: 'HEALTHY' | 'WARNING' | 'HIGH_RISK';
  readonly competitiveRank: number; // 1-based rank among location & competitors
  readonly actionableInsight: string;
}

@Injectable()
export class CalculateReputationHealthUseCase {
  constructor(
    @Inject('ReputationRepository')
    private readonly reputationRepository: ReputationRepository
  ) {}

  public async execute(locationId: string): Promise<ReputationHealthReport> {
    const reviews = await this.reputationRepository.listReviewsForLocation(locationId);
    const benchmarks = await this.reputationRepository.getCompetitorBenchmarks(locationId);

    const totalReviews = reviews.length;
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let ratingSum = 0;

    for (const review of reviews) {
      ratingSum += review.rating;
      const sentiment = new ReviewSentiment(review);
      const cat = sentiment.getCategory();
      if (cat === 'POSITIVE') positive++;
      else if (cat === 'NEGATIVE') negative++;
      else neutral++;
    }

    const averageRating = totalReviews === 0 ? 5.0 : Number((ratingSum / totalReviews).toFixed(2));
    const negativeRatio = totalReviews === 0 ? 0 : negative / totalReviews;

    let riskStatus: 'HEALTHY' | 'WARNING' | 'HIGH_RISK' = 'HEALTHY';
    if (negativeRatio >= 0.25 || averageRating < 4.0) {
      riskStatus = 'HIGH_RISK';
    } else if (negativeRatio >= 0.1 || averageRating < 4.5) {
      riskStatus = 'WARNING';
    }

    // Competitive ranking: compare our average rating with competitors
    const allRatings = [averageRating, ...benchmarks.map((b) => b.averageRating)].sort(
      (a, b) => b - a
    );
    const competitiveRank = allRatings.indexOf(averageRating) + 1;

    let actionableInsight = 'Location reputation is strong. Maintain post-visit review cadence.';
    if (riskStatus === 'HIGH_RISK') {
      actionableInsight =
        'High negative review ratio detected. Immediate founder intervention & direct client outreach required.';
    } else if (riskStatus === 'WARNING') {
      actionableInsight = 'Rating slipping below 4.5. Review recent service speed and wait times.';
    } else if (competitiveRank > 1) {
      actionableInsight = 'Good standing, but trailing top local competitor in average rating.';
    }

    return {
      locationId,
      totalReviews,
      averageRating,
      sentimentBreakdown: { positive, neutral, negative },
      riskStatus,
      competitiveRank,
      actionableInsight,
    };
  }
}
