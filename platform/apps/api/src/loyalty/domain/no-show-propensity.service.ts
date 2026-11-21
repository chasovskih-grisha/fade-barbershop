// No-Show Propensity Service (T-5009)
// Pure wrappers around the scoring model — no Prisma/DB dependencies in domain.

import { buildNoShowFeatures, calculateNoShowPropensity } from './no-show-propensity';
import type {
  NoShowFeatureInput,
  NoShowPropensityFeatures,
  NoShowPropensityScore,
} from './no-show-propensity.types';

export type { NoShowPropensityFeatures, NoShowPropensityScore } from './no-show-propensity.types';

export interface NoShowDepositRequirement {
  requiresDepositHold: boolean;
  depositPercent: number;
  reason: string | undefined;
}

export interface NoShowPolicyAdjustment {
  depositPercent: number;
  reason: string | undefined;
}

/** Injectable wrapper for no-show scoring and deposit policy decisions. */
export class NoShowPropensityService {
  scoreAppointment(features: NoShowPropensityFeatures): NoShowPropensityScore {
    return calculateNoShowPropensity(features);
  }

  buildNoShowFeatures(input: NoShowFeatureInput): NoShowPropensityFeatures {
    return buildNoShowFeatures(input);
  }

  getDepositRequirement(score: NoShowPropensityScore): NoShowDepositRequirement {
    return {
      requiresDepositHold: score.requiresDepositHold,
      depositPercent: score.depositPercent,
      reason: undefined,
    };
  }

  enhanceBookingPolicy(
    existingDepositPercent: number,
    score: NoShowPropensityScore
  ): NoShowPolicyAdjustment {
    const reason = `ML no-show risk model: ${score.tier} risk (score: ${score.score.toFixed(2)}), factors: ${score.factors.join(', ')}`;

    if (score.tier === 'HIGH' && score.depositPercent > existingDepositPercent) {
      return { depositPercent: score.depositPercent, reason };
    }
    if (
      score.tier === 'MEDIUM' &&
      score.depositPercent > existingDepositPercent &&
      score.depositPercent <= 50
    ) {
      return { depositPercent: 50, reason };
    }
    return { depositPercent: existingDepositPercent, reason: undefined };
  }
}
