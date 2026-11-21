import type {
  ClientBirthdayAnniversaryRequest,
  ClientBirthdayAnniversaryResult,
  OnboardingSequenceRequest,
  OnboardingSequenceResult,
  ReferralAttributionRequest,
  ReferralTierRequest,
  ReferralTierResult,
  ReferralValidationResult,
  RetentionMilestoneRequest,
  RetentionMilestoneResult,
  RetentionStreakRequest,
  RetentionStreakResult,
  SmartReferralBoosterRequest,
  SmartReferralBoosterResult,
  WinBackCampaignRequest,
  WinBackCampaignResult,
} from './types';
import { calculateBirthdayAnniversaryIncentive } from './birthday';
import { calculateMilestones } from './milestones';
import { calculateOnboardingSequence } from './onboarding';
import { calculateReferralTier } from './referral-tiers';
import { calculateRetentionStreak } from './streak';
import { calculateSmartReferralBooster } from './referral-booster';
import { calculateWinBackOffer } from './winback';
import { validateReferral } from './referral-validation';

export class RetentionEngine {
  public calculateWinBackOffer(request: WinBackCampaignRequest): WinBackCampaignResult {
    return calculateWinBackOffer(request);
  }

  public validateReferral(request: ReferralAttributionRequest): ReferralValidationResult {
    return validateReferral(request);
  }

  public calculateMilestones(request: RetentionMilestoneRequest): RetentionMilestoneResult {
    return calculateMilestones(request);
  }

  public calculateOnboardingSequence(request: OnboardingSequenceRequest): OnboardingSequenceResult {
    return calculateOnboardingSequence(request);
  }

  public calculateReferralTier(request: ReferralTierRequest): ReferralTierResult {
    return calculateReferralTier(request);
  }

  public calculateSmartReferralBooster(
    request: SmartReferralBoosterRequest
  ): SmartReferralBoosterResult {
    return calculateSmartReferralBooster(request);
  }

  public calculateRetentionStreak(request: RetentionStreakRequest): RetentionStreakResult {
    return calculateRetentionStreak(request);
  }

  public calculateBirthdayAnniversaryIncentive(
    request: ClientBirthdayAnniversaryRequest
  ): ClientBirthdayAnniversaryResult {
    return calculateBirthdayAnniversaryIncentive(request);
  }
}
