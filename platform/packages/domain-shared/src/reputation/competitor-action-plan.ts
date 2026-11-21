import type { CompetitorActionPlanRequest, CompetitorActionPlanResult } from './types';

function resolvePriority(
  request: CompetitorActionPlanRequest
): CompetitorActionPlanResult['strategicPriority'] {
  const delta = request.fadeAverageRating - request.marketAverageRating;
  if (request.unrepliedNegativeCount > 0 || delta < -0.2) return 'High';
  if (delta < 0) return 'Medium';
  return 'Low';
}

function buildActionItems(
  request: CompetitorActionPlanRequest
): CompetitorActionPlanResult['actionItems'] {
  const delta = request.fadeAverageRating - request.marketAverageRating;
  const actionItems: CompetitorActionPlanResult['actionItems'] = [];

  if (delta < 0) {
    actionItems.push({
      category: 'Quality & Operations',
      title: 'Close Rating Gap with Market Leader',
      description: `FADE rating (${request.fadeAverageRating}) is trailing market average (${request.marketAverageRating}). Conduct staff quality audits on bottom-performing barber stations.`,
      impact: 'High',
    });
  } else {
    actionItems.push({
      category: 'Competitive Positioning',
      title: 'Capitalize on Market Leadership',
      description: `FADE rating leads the local market. Highlight Google & Yelp star ratings in promotional banners and social ads.`,
      impact: 'High',
    });
  }

  if (request.unrepliedNegativeCount > 0) {
    actionItems.push({
      category: 'Response Speed',
      title: 'Resolve Pending Negative Reviews',
      description: `There are ${request.unrepliedNegativeCount} unreplied negative or low-rating reviews. Immediate manager response within 2 hours prevents churn.`,
      impact: 'High',
    });
  }

  actionItems.push({
    category: 'Review Acquisition',
    title: 'Automated Post-Visit SMS Review Trigger',
    description:
      'Ensure automated SMS review requests are sent 30 minutes after appointment completion to boost review velocity and dilute older negative feedback.',
    impact: 'Medium',
  });

  return actionItems;
}

/**
 * Generate an actionable strategic plan to improve market reputation and beat local competitors.
 */
export function generateCompetitorActionPlan(
  request: CompetitorActionPlanRequest
): CompetitorActionPlanResult {
  const strategicPriority = resolvePriority(request);
  return {
    strategicPriority,
    actionItems: buildActionItems(request),
    summaryRecommendation:
      strategicPriority === 'High'
        ? 'Urgent operational intervention required to address pending negative reviews and close rating deficit.'
        : 'Reputation is healthy. Focus on automated review acquisition and maintaining stellar service standards.',
  };
}
