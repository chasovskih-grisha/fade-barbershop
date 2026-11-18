import { Injectable, Inject } from '@nestjs/common';
import type { CompetitorBenchmarkRepository } from './ports';

export interface AnalyzeMarketGapsQuery {
  locationId: string;
  ourRating: number;
  ourAveragePrice: number;
  ourReviewCount: number;
}

export interface CompetitorGapSummary {
  competitorName: string;
  platform: string;
  ratingGap: number; // positive means competitor rating is higher
  reviewCountGap: number; // positive means competitor has more reviews
  priceDifferencePercent: number;
  threatAssessment: 'STRONG_RIVAL' | 'PRICE_LEADER' | 'WEAKER';
}

export interface MarketGapAnalysisResult {
  locationId: string;
  seoThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  pricingStrategy: 'PREMIUM_LEADER' | 'VALUE_LEADER' | 'COMPETITIVE_PARITY' | 'DISADVANTAGED';
  recommendations: string[];
  competitorGaps: CompetitorGapSummary[];
}

@Injectable()
export class AnalyzeCompetitiveMarketGapsUseCase {
  constructor(
    @Inject('CompetitorBenchmarkRepository')
    private readonly competitorRepo: CompetitorBenchmarkRepository,
  ) {}

  async execute(query: AnalyzeMarketGapsQuery): Promise<MarketGapAnalysisResult> {
    const competitors = await this.competitorRepo.findByLocationId(query.locationId);

    if (competitors.length === 0) {
      return {
        locationId: query.locationId,
        seoThreatLevel: 'LOW',
        pricingStrategy: 'COMPETITIVE_PARITY',
        recommendations: ['No local competitors tracked yet. Add competitor benchmarks to enable market gap analysis.'],
        competitorGaps: [],
      };
    }

    const maxCompetitorReviews = Math.max(...competitors.map((c) => c.reviewCount));
    const avgCompetitorRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.averageHaircutPrice, 0) / competitors.length;

    let seoThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (query.ourReviewCount < maxCompetitorReviews * 0.5 || query.ourReviewCount < 50) {
      seoThreatLevel = 'HIGH';
    } else if (query.ourReviewCount < maxCompetitorReviews) {
      seoThreatLevel = 'MEDIUM';
    }

    let pricingStrategy: 'PREMIUM_LEADER' | 'VALUE_LEADER' | 'COMPETITIVE_PARITY' | 'DISADVANTAGED' = 'COMPETITIVE_PARITY';
    const priceRatio = query.ourAveragePrice / avgCompetitorPrice;
    const ratingDelta = query.ourRating - avgCompetitorRating;

    if (priceRatio > 1.15 && ratingDelta >= 0) {
      pricingStrategy = 'PREMIUM_LEADER';
    } else if (priceRatio < 0.85 && ratingDelta >= -0.2) {
      pricingStrategy = 'VALUE_LEADER';
    } else if (priceRatio > 1.1 && ratingDelta < -0.1) {
      pricingStrategy = 'DISADVANTAGED';
    }

    const recommendations: string[] = [];
    if (seoThreatLevel === 'HIGH') {
      recommendations.push(
        'High SEO threat: Top local competitor review volume significantly outpaces ours. Accelerate post-visit Google review request automation.'
      );
    }
    if (pricingStrategy === 'DISADVANTAGED') {
      recommendations.push(
        'Pricing disadvantage: Our prices are higher than market average while ratings trail behind. Audit service quality or adjust pricing tiers.'
      );
    } else if (pricingStrategy === 'PREMIUM_LEADER') {
      recommendations.push(
        'Positioned as Premium Leader: Ensure VIP experience and exclusive service packages (T-3901) justify the higher price point.'
      );
    }

    const competitorGaps: CompetitorGapSummary[] = competitors.map((c) => {
      const ratingGap = Number((c.rating - query.ourRating).toFixed(2));
      const reviewCountGap = c.reviewCount - query.ourReviewCount;
      const priceDifferencePercent = c.priceDifferencePercent(query.ourAveragePrice);

      let threatAssessment: 'STRONG_RIVAL' | 'PRICE_LEADER' | 'WEAKER' = 'WEAKER';
      if (c.rating >= query.ourRating && c.reviewCount > query.ourReviewCount) {
        threatAssessment = 'STRONG_RIVAL';
      } else if (c.averageHaircutPrice < query.ourAveragePrice * 0.9 && c.rating >= query.ourRating - 0.2) {
        threatAssessment = 'PRICE_LEADER';
      }

      return {
        competitorName: c.competitorName,
        platform: c.platform,
        ratingGap,
        reviewCountGap,
        priceDifferencePercent,
        threatAssessment,
      };
    });

    return {
      locationId: query.locationId,
      seoThreatLevel,
      pricingStrategy,
      recommendations,
      competitorGaps,
    };
  }
}
