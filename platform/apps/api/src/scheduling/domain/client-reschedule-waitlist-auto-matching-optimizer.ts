/* eslint-disable max-lines, complexity, max-statements -- cohesive module (128 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: optimizeWaitlistAutoMatching, complexity 18 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: optimizeWaitlistAutoMatching, 32 statements vs 30); extraction tracked in T-2500f */
export interface WaitlistCandidate {
  candidateId: string;
  clientId: string;
  clientName: string;
  isVip: boolean;
  historicalNoShowRate: number; // 0.0 to 1.0
  preferredBarberId?: string;
  requestedServiceDurationMinutes: number;
  waitlistedAt: Date;
  flexibleWithBarber: boolean;
}

export interface SlotAvailabilityOpening {
  slotId: string;
  locationId: string;
  barberId: string;
  startTime: Date;
  endTime: Date;
  availableDurationMinutes: number;
}

export interface MatchEvaluationResult {
  candidateId: string;
  slotId: string;
  matchScore: number; // 0.0 to 1.0
  priorityTier: 'URGENT_VIP' | 'HIGH_PRIORITY' | 'STANDARD' | 'LOW_PRIORITY';
  autoOfferRecommended: boolean;
  reason: string;
}

export interface AutoMatchingOptimizerConfig {
  maxNoShowThreshold: number; // e.g. 0.25
  vipBonusWeight: number; // e.g. 0.3
  preferredBarberBonusWeight: number; // e.g. 0.2
  durationFitWeight: number; // e.g. 0.3
  reliabilityWeight: number; // e.g. 0.2
}

export const DEFAULT_AUTOMATCHING_CONFIG: AutoMatchingOptimizerConfig = {
  maxNoShowThreshold: 0.25,
  vipBonusWeight: 0.3,
  preferredBarberBonusWeight: 0.2,
  durationFitWeight: 0.3,
  reliabilityWeight: 0.2,
};

/**
 * Optimizes last-minute appointment slot backfill by intelligently matching waitlist candidates
 * and pending rescheduling requests against newly opened calendar slots.
 */
export function optimizeWaitlistAutoMatching(
  candidates: WaitlistCandidate[],
  opening: SlotAvailabilityOpening,
  config: AutoMatchingOptimizerConfig = DEFAULT_AUTOMATCHING_CONFIG
): MatchEvaluationResult[] {
  const evaluations: MatchEvaluationResult[] = [];

  for (const candidate of candidates) {
    if (candidate.historicalNoShowRate > config.maxNoShowThreshold) {
      evaluations.push({
        candidateId: candidate.candidateId,
        slotId: opening.slotId,
        matchScore: 0,
        priorityTier: 'LOW_PRIORITY',
        autoOfferRecommended: false,
        reason: `Candidate excluded due to high historical no-show rate (${(candidate.historicalNoShowRate * 100).toFixed(1)}%).`,
      });
      continue;
    }

    if (candidate.requestedServiceDurationMinutes > opening.availableDurationMinutes) {
      evaluations.push({
        candidateId: candidate.candidateId,
        slotId: opening.slotId,
        matchScore: 0,
        priorityTier: 'LOW_PRIORITY',
        autoOfferRecommended: false,
        reason: `Slot duration (${opening.availableDurationMinutes}m) is insufficient for requested service (${candidate.requestedServiceDurationMinutes}m).`,
      });
      continue;
    }

    // 1. Duration fit score (exact fit gets 1.0, slight under-fit gets scaled)
    const durationFitRatio =
      candidate.requestedServiceDurationMinutes / opening.availableDurationMinutes;
    const durationScore = Math.min(1.0, durationFitRatio);

    // 2. Reliability score (inverse of no-show rate)
    const reliabilityScore = 1.0 - Math.min(1.0, Math.max(0, candidate.historicalNoShowRate));

    // 3. VIP bonus
    const vipScore = candidate.isVip ? 1.0 : 0.0;

    // 4. Barber preference match
    const barberMatch =
      !candidate.preferredBarberId ||
      candidate.preferredBarberId === opening.barberId ||
      candidate.flexibleWithBarber;

    if (!barberMatch) {
      evaluations.push({
        candidateId: candidate.candidateId,
        slotId: opening.slotId,
        matchScore: 0,
        priorityTier: 'LOW_PRIORITY',
        autoOfferRecommended: false,
        reason: `Candidate preferred barber (${candidate.preferredBarberId}) does not match opening barber (${opening.barberId}) and candidate is not flexible.`,
      });
      continue;
    }

    const barberPreferenceScore =
      candidate.preferredBarberId === opening.barberId
        ? 1.0
        : candidate.flexibleWithBarber
          ? 0.7
          : 0.0;

    const rawScore =
      durationScore * config.durationFitWeight +
      reliabilityScore * config.reliabilityWeight +
      vipScore * config.vipBonusWeight +
      barberPreferenceScore * config.preferredBarberBonusWeight;

    const matchScore = Number(Math.min(1.0, Math.max(0, rawScore)).toFixed(4));

    let priorityTier: MatchEvaluationResult['priorityTier'] = 'STANDARD';
    if (matchScore >= 0.85 && (candidate.isVip || durationScore >= 0.9)) {
      priorityTier = 'URGENT_VIP';
    } else if (matchScore >= 0.7) {
      priorityTier = 'HIGH_PRIORITY';
    } else if (matchScore >= 0.5) {
      priorityTier = 'STANDARD';
    } else {
      priorityTier = 'LOW_PRIORITY';
    }

    const autoOfferRecommended = matchScore >= 0.75;

    let reason = `Match score ${(matchScore * 100).toFixed(1)}%. `;
    if (candidate.isVip) reason += 'VIP status prioritized. ';
    if (durationScore >= 0.9) reason += 'Optimal duration fit. ';
    if (candidate.preferredBarberId === opening.barberId) reason += 'Preferred barber match. ';

    evaluations.push({
      candidateId: candidate.candidateId,
      slotId: opening.slotId,
      matchScore,
      priorityTier,
      autoOfferRecommended,
      reason,
    });
  }

  // Sort descending by match score
  return evaluations.sort((a, b) => b.matchScore - a.matchScore);
}
