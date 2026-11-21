import type { RetentionMilestoneRequest, RetentionMilestoneResult } from './types';

type Tier = RetentionMilestoneResult['currentTier'];

function resolveTier(completedVisits: number): { currentTier: Tier; nextMilestoneVisits: number } {
  if (completedVisits >= 20) return { currentTier: 'vip', nextMilestoneVisits: 25 };
  if (completedVisits >= 10) return { currentTier: 'gold', nextMilestoneVisits: 20 };
  if (completedVisits >= 5) return { currentTier: 'silver', nextMilestoneVisits: 10 };
  return { currentTier: 'standard', nextMilestoneVisits: 5 };
}

function calculateRetentionScore(request: RetentionMilestoneRequest): number {
  const recencyFactor = Math.max(0, 100 - request.lastVisitDaysAgo * 1.5);
  const frequencyFactor = Math.min(100, request.completedVisits * 10);
  const spendFactor = Math.min(100, request.totalSpent / 5);
  const score = Math.round(recencyFactor * 0.4 + frequencyFactor * 0.4 + spendFactor * 0.2);
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate client retention milestone and engagement score.
 */
export function calculateMilestones(request: RetentionMilestoneRequest): RetentionMilestoneResult {
  const { currentTier, nextMilestoneVisits } = resolveTier(request.completedVisits);

  return {
    clientId: request.clientId,
    currentTier,
    nextMilestoneVisits,
    milestoneBonusAvailable: request.completedVisits > 0 && request.completedVisits % 5 === 0,
    retentionScore: calculateRetentionScore(request),
  };
}
