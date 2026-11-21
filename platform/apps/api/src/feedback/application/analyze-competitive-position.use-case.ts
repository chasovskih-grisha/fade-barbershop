import { Injectable, Inject } from '@nestjs/common';
import type { CompetitorBenchmarkRepository } from './ports';

export interface AnalyzeCompetitivePositionQuery {
  locationId: string;
  ourRating: number;
  ourAveragePrice: number;
}

export interface CompetitorInsight {
  competitorName: string;
  platform: string;
  rating: number;
  priceDifferencePercent: number;
  isOurRatingBetter: boolean;
}

export interface CompetitivePositionResult {
  locationId: string;
  marketAverageRating: number;
  marketAveragePrice: number;
  ratingDelta: number;
  priceCompetitiveness: 'CHEAPER' | 'FAIR' | 'PREMIUM';
  competitorInsights: CompetitorInsight[];
}

@Injectable()
export class AnalyzeCompetitivePositionUseCase {
  constructor(
    @Inject('CompetitorBenchmarkRepository')
    private readonly competitorRepo: CompetitorBenchmarkRepository
  ) {}

  async execute(query: AnalyzeCompetitivePositionQuery): Promise<CompetitivePositionResult> {
    const competitors = await this.competitorRepo.findByLocationId(query.locationId);

    if (competitors.length === 0) {
      return {
        locationId: query.locationId,
        marketAverageRating: 0,
        marketAveragePrice: 0,
        ratingDelta: 0,
        priceCompetitiveness: 'FAIR',
        competitorInsights: [],
      };
    }

    const totalRating = competitors.reduce((sum, c) => sum + c.rating, 0);
    const totalPrices = competitors.reduce((sum, c) => sum + c.averageHaircutPrice, 0);
    const marketAverageRating = Number((totalRating / competitors.length).toFixed(2));
    const marketAveragePrice = Math.round(totalPrices / competitors.length);

    const ratingDelta = Number((query.ourRating - marketAverageRating).toFixed(2));

    const priceDiffRatio = (query.ourAveragePrice - marketAveragePrice) / marketAveragePrice;
    let priceCompetitiveness: 'CHEAPER' | 'FAIR' | 'PREMIUM' = 'FAIR';
    if (priceDiffRatio < -0.1) {
      priceCompetitiveness = 'CHEAPER';
    } else if (priceDiffRatio > 0.1) {
      priceCompetitiveness = 'PREMIUM';
    }

    const competitorInsights: CompetitorInsight[] = competitors.map((c) => ({
      competitorName: c.competitorName,
      platform: c.platform,
      rating: c.rating,
      priceDifferencePercent: c.priceDifferencePercent(query.ourAveragePrice),
      isOurRatingBetter: query.ourRating >= c.rating,
    }));

    return {
      locationId: query.locationId,
      marketAverageRating,
      marketAveragePrice,
      ratingDelta,
      priceCompetitiveness,
      competitorInsights,
    };
  }
}
