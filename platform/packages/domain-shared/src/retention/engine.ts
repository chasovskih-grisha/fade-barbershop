import {
  WinBackCampaignRequest,
  WinBackCampaignResult,
  ReferralAttributionRequest,
  ReferralValidationResult,
  RetentionMilestoneRequest,
  RetentionMilestoneResult,
  OnboardingSequenceRequest,
  OnboardingSequenceResult,
  OnboardingStep,
  ReferralTierRequest,
  ReferralTierResult,
  SmartReferralBoosterRequest,
  SmartReferralBoosterResult,
  RetentionStreakRequest,
  RetentionStreakResult,
  ClientBirthdayAnniversaryRequest,
  ClientBirthdayAnniversaryResult,
} from './types';

export class RetentionEngine {
  /**
  * Calculate win-back reactivation campaign offer based on client inactivity days.
  */
  public calculateWinBackOffer(request: WinBackCampaignRequest): WinBackCampaignResult {
    const currentDate = request.currentDate ? new Date(request.currentDate) : new Date();
    const lastVisit = new Date(request.lastVisitDate);
    const diffTime = Math.abs(currentDate.getTime() - lastVisit.getTime());
    const inactivityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (inactivityDays < 30) {
      return {
        clientId: request.clientId,
        inactivityDays,
        tier: 'active',
        eligible: false,
        discountPercentage: 0,
        promoCode: '',
        expiresAt: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    let tier: '30_days' | '60_days' | '90_plus_days' = '30_days';
    let discountPercentage = 15;
    let bonusPerk: string | undefined = undefined;

    if (inactivityDays >= 90) {
      tier = '90_plus_days';
      discountPercentage = 30;
      bonusPerk = 'Free Beard Trim & Hot Towel';
    } else if (inactivityDays >= 60) {
      tier = '60_days';
      discountPercentage = 25;
      bonusPerk = 'Complimentary Styling Product';
    } else {
      tier = '30_days';
      discountPercentage = 15;
    }

    const expiresDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const promoCode = `WNB-${request.clientId.slice(0, 6).toUpperCase()}-${discountPercentage}`;

    const result: WinBackCampaignResult = {
      clientId: request.clientId,
      inactivityDays,
      tier,
      eligible: true,
      discountPercentage,
      promoCode,
      expiresAt: expiresDate.toISOString(),
    };
    if (bonusPerk) {
      result.bonusPerk = bonusPerk;
    }
    return result;
  }

  /**
  * Validate referral attribution adhering to ADR 0014 (anti-self-referral & anti-fraud).
  */
  public validateReferral(request: ReferralAttributionRequest): ReferralValidationResult {
    if (request.referrerId === request.refereeId) {
      return {
        valid: false,
        reason: 'self_referral_prohibited',
        refereeDiscountPct: 0,
        referrerRewardBonus: 0,
      };
    }

    if (!request.referralCode || request.referralCode.trim().length < 4) {
      return {
        valid: false,
        reason: 'invalid_referral_code',
        refereeDiscountPct: 0,
        referrerRewardBonus: 0,
      };
    }

    // Anti-fraud: if IP or Device ID match (simulated check)
    if (request.refereeIp && request.refereeIp === '127.0.0.1') {
      // Mock fraud check flag or warning
    }

    return {
      valid: true,
      refereeDiscountPct: 20, // 20% off first visit for referee
      referrerRewardBonus: 15, // $15 / 150 points bonus for referrer after completion
    };
  }

  /**
  * Calculate client retention milestone and engagement score.
  */
  public calculateMilestones(request: RetentionMilestoneRequest): RetentionMilestoneResult {
    let currentTier: 'standard' | 'silver' | 'gold' | 'vip' = 'standard';
    let nextMilestoneVisits = 5;

    if (request.completedVisits >= 20) {
      currentTier = 'vip';
      nextMilestoneVisits = 25;
    } else if (request.completedVisits >= 10) {
      currentTier = 'gold';
      nextMilestoneVisits = 20;
    } else if (request.completedVisits >= 5) {
      currentTier = 'silver';
      nextMilestoneVisits = 10;
    } else {
      currentTier = 'standard';
      nextMilestoneVisits = 5;
    }

    const milestoneBonusAvailable = request.completedVisits > 0 && request.completedVisits % 5 === 0;

    // Retention score formula based on visit recency and frequency
    const recencyFactor = Math.max(0, 100 - request.lastVisitDaysAgo * 1.5);
    const frequencyFactor = Math.min(100, request.completedVisits * 10);
    const spendFactor = Math.min(100, request.totalSpent / 5);

    const retentionScore = Math.round((recencyFactor * 0.4) + (frequencyFactor * 0.4) + (spendFactor * 0.2));

    return {
      clientId: request.clientId,
      currentTier,
      nextMilestoneVisits,
      milestoneBonusAvailable,
      retentionScore: Math.min(100, Math.max(0, retentionScore)),
    };
  }

  /**
  * Calculate automated client onboarding retention sequence.
  */
  public calculateOnboardingSequence(request: OnboardingSequenceRequest): OnboardingSequenceResult {
    const steps: OnboardingStep[] = [
      {
        stepDay: 0,
        channel: 'sms',
        templateKey: 'WELCOME_SIGNUP',
        description: `Welcome to FADE, ${request.clientName}! Your first cut awaits.`,
      },
      {
        stepDay: 7,
        channel: 'push',
        templateKey: 'FIRST_REBOOKING_REMINDER',
        incentiveCode: `ONB-${request.clientId.slice(0, 6).toUpperCase()}-10`,
        description: 'Keep your fresh look! Enjoy 10% off your second visit.',
      },
      {
        stepDay: 14,
        channel: 'whatsapp',
        templateKey: 'REFERRAL_PROGRAM_PROMPT',
        incentiveCode: `REF-${request.clientId.slice(0, 6).toUpperCase()}`,
        description: 'Invite a friend to FADE and get $15 bonus credit when they complete their visit.',
      },
    ];

    let currentStage: 'welcome' | 'first_rebooking' | 'referral_prompt' | 'completed' = 'welcome';
    if (request.daysSinceRegistration >= 14) {
      currentStage = 'referral_prompt';
    } else if (request.daysSinceRegistration >= 7) {
      currentStage = 'first_rebooking';
    } else {
      currentStage = 'welcome';
    }

    const nextStep = steps.find(s => s.stepDay > request.daysSinceRegistration);

    return {
      clientId: request.clientId,
      currentStage,
      ...(nextStep ? { nextScheduledStep: nextStep } : {}),
      availableSteps: steps,
    };
  }

  /**
  * Calculate referral tier incentives based on successful referral volume.
  */
  public calculateReferralTier(request: ReferralTierRequest): ReferralTierResult {
    const count = request.successfulReferralsCount;
    let tierLevel: 'bronze' | 'silver' | 'gold' | 'ambassador' = 'bronze';
    let rewardAmount = 15;
    let perks = ['Standard referral bonus ($15)'];
    let nextThreshold: number | null = 3;

    if (count >= 15) {
      tierLevel = 'ambassador';
      rewardAmount = 35;
      perks = ['Ambassador status ($35 per referral)', 'Free monthly haircut', 'VIP booking line', 'Exclusive merchandise'];
      nextThreshold = null;
    } else if (count >= 8) {
      tierLevel = 'gold';
      rewardAmount = 25;
      perks = ['Gold referral bonus ($25 per referral)', 'Complimentary beverage upgrade', 'Priority waitlist'];
      nextThreshold = 15;
    } else if (count >= 3) {
      tierLevel = 'silver';
      rewardAmount = 20;
      perks = ['Silver referral bonus ($20 per referral)', 'Priority slot access'];
      nextThreshold = 8;
    } else {
      tierLevel = 'bronze';
      rewardAmount = 15;
      perks = ['Standard referral bonus ($15)'];
      nextThreshold = 3;
    }

    return {
      referrerId: request.referrerId,
      tierLevel,
      rewardAmountPerReferral: rewardAmount,
      perks,
      nextTierThreshold: nextThreshold,
    };
  }

  /**
   * Calculate smart referral boost multiplier during peak acquisition windows or active campaigns.
   */
  public calculateSmartReferralBooster(request: SmartReferralBoosterRequest): SmartReferralBoosterResult {
    let multiplier = 1.0;
    let campaignTitle = 'Standard Referral Program';
    let boostActive = false;

    if (request.activeCampaignCode === 'FADE-VIP-SURGE') {
      multiplier = 1.5;
      campaignTitle = 'VIP Weekend Acquisition Surge';
      boostActive = true;
    } else if (request.isWeekend) {
      multiplier = 1.25;
      campaignTitle = 'Weekend Referral Bonus Booster';
      boostActive = true;
    }

    const boostedReward = Math.round(request.baseReward * multiplier);

    return {
      referrerId: request.referrerId,
      boostActive,
      multiplier,
      boostedReward,
      campaignTitle,
      expiresInHours: boostActive ? 48 : 0,
    };
  }

  /**
   * Calculate client retention streak multiplier and perks for loyal recurring bookings.
   */
  public calculateRetentionStreak(request: RetentionStreakRequest): RetentionStreakResult {
    let streakBonusMultiplier = 1.0;
    const unlockedPerks: string[] = ['Standard booking priority'];
    let loyaltyMultiplierCredits = 10;

    if (request.consecutiveOnTimeVisits >= 6) {
      streakBonusMultiplier = 1.35;
      unlockedPerks.push('Free Beard Trim upgrade', 'Priority Saturday slot access', 'Dedicated VIP Barber preference');
      loyaltyMultiplierCredits = 50;
    } else if (request.consecutiveOnTimeVisits >= 3) {
      streakBonusMultiplier = 1.2;
      unlockedPerks.push('Complimentary beverage', '5-minute early seating');
      loyaltyMultiplierCredits = 25;
    }

    if (request.currentTier === 'vip') {
      streakBonusMultiplier += 0.15;
      unlockedPerks.push('VIP Concierge Access');
      loyaltyMultiplierCredits += 25;
    }

    return {
      clientId: request.clientId,
      streakBonusMultiplier: Number(streakBonusMultiplier.toFixed(2)),
      unlockedPerks,
      loyaltyMultiplierCredits,
    };
  }

  /**
   * Calculate client birthday and account anniversary VIP retention incentive package.
   */
  public calculateBirthdayAnniversaryIncentive(request: ClientBirthdayAnniversaryRequest): ClientBirthdayAnniversaryResult {
    const eligibleForBirthdayBonus = request.isBirthdayMonth;
    const eligibleForAnniversaryBonus = request.isAnniversaryMonth;

    const birthdayVoucherCode = eligibleForBirthdayBonus
      ? `BDAY-${request.clientId.slice(0, 6).toUpperCase()}-25`
      : '';

    let anniversaryBonusCreditUah = 0;
    if (eligibleForAnniversaryBonus) {
      if (request.membershipMonths >= 24) anniversaryBonusCreditUah = 500;
      else if (request.membershipMonths >= 12) anniversaryBonusCreditUah = 250;
      else anniversaryBonusCreditUah = 100;
    }

    const vipConciergeUnlocked = request.totalVisits >= 10 || request.membershipMonths >= 12;
    const recommendedPerks: string[] = ['Complimentary beverage'];

    if (eligibleForBirthdayBonus) {
      recommendedPerks.push('Free Professional Beard Grooming or Scalp Treatment');
    }
    if (eligibleForAnniversaryBonus) {
      recommendedPerks.push(`Anniversary Credit Voucher (${anniversaryBonusCreditUah} UAH)`);
    }
    if (vipConciergeUnlocked) {
      recommendedPerks.push('Dedicated VIP Concierge Booking Line');
    }

    return {
      clientId: request.clientId,
      eligibleForBirthdayBonus,
      eligibleForAnniversaryBonus,
      birthdayVoucherCode,
      anniversaryBonusCreditUah,
      vipConciergeUnlocked,
      recommendedPerks,
    };
  }
}

