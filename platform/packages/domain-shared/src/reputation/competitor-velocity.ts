import type { CompetitorVelocityAnalysisRequest, CompetitorVelocityAnalysisResult } from './types';

interface CompetitorSummary {
  name: string;
  avgMonthly: number;
  rating: number;
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function summarizeCompetitors(request: CompetitorVelocityAnalysisRequest): {
  summaries: CompetitorSummary[];
  totalMarketMonthly: number;
} {
  let totalMarketMonthly = average(request.fadeMonthlyReviews || []);
  const summaries = (request.competitors || []).map((competitor) => {
    const avgMonthly = average(competitor.monthlyReviews);
    totalMarketMonthly += avgMonthly;
    return {
      name: competitor.competitorName,
      avgMonthly,
      rating: competitor.averageRating,
    };
  });

  return { summaries, totalMarketMonthly };
}

interface MarketRanking {
  fadeRank: number;
  marketLeader: string;
}

function rankMarket(
  request: CompetitorVelocityAnalysisRequest,
  avgFadeMonthly: number
): MarketRanking {
  const allEntrants = [
    { name: 'FADE Platform', rating: request.fadeAverageRating, volume: avgFadeMonthly },
    ...(request.competitors || []).map((competitor) => ({
      name: competitor.competitorName,
      rating: competitor.averageRating,
      volume: average(competitor.monthlyReviews),
    })),
  ].sort((a, b) => b.rating - a.rating || b.volume - a.volume);

  const fadeIndex = allEntrants.findIndex((entrant) => entrant.name === 'FADE Platform');
  return {
    fadeRank: fadeIndex >= 0 ? fadeIndex + 1 : 1,
    marketLeader: allEntrants[0]?.name || 'FADE Platform',
  };
}

function buildRecommendations(
  fadeRank: number,
  marketLeader: string,
  avgFadeMonthly: number
): string[] {
  const recommendations: string[] = [];
  if (fadeRank === 1) {
    recommendations.push('Maintain review acquisition pace to protect market leadership position.');
  } else {
    recommendations.push(
      `Competitor "${marketLeader}" leads in rating/volume. Increase post-visit review requests to capture market share.`
    );
  }

  if (avgFadeMonthly < 10) {
    recommendations.push(
      'Monthly review volume is low. Enable automated post-visit SMS triggers to boost review velocity.'
    );
  }
  return recommendations;
}

/**
 * Analyze competitor review velocity, market share of voice, and competitive ranking.
 */
export function analyzeCompetitorVelocity(
  request: CompetitorVelocityAnalysisRequest
): CompetitorVelocityAnalysisResult {
  const avgFadeMonthly = average(request.fadeMonthlyReviews || []);
  const { totalMarketMonthly } = summarizeCompetitors(request);
  const fadeMarketShareOfVoice =
    totalMarketMonthly > 0 ? Number(((avgFadeMonthly / totalMarketMonthly) * 100).toFixed(1)) : 100;
  const { fadeRank, marketLeader } = rankMarket(request, avgFadeMonthly);
  const threatLevel = fadeRank > 2 ? 'high' : fadeRank === 2 ? 'moderate' : 'low';

  return {
    fadeReviewGrowthVelocity: Number(avgFadeMonthly.toFixed(1)),
    fadeMarketShareOfVoice,
    marketLeader,
    threatLevel,
    competitiveRank: fadeRank,
    recommendations: buildRecommendations(fadeRank, marketLeader, avgFadeMonthly),
  };
}
