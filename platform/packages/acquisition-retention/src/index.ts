/**
 * FADE Customer Acquisition & Retention Engine
 * Handles referral programs, client onboarding sequences, win-back reactivation flows, and retention incentives.
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  lastVisitDate?: Date;
  birthDate?: Date;
  membershipStatus?: 'NONE' | 'UNLIMITED_MONTHLY' | 'VIP_PASS';
  membershipRenewalDate?: Date;
  totalVisits: number;
  totalSpent: number;
  referredBy?: string;
  referralCode: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP';
  pointsBalance: number;
}

export interface ReferralReward {
  referrerCredit: number;
  refereeDiscount: number;
  referrerPoints: number;
}

export interface OnboardingStep {
  stepNumber: number;
  delayHours: number;
  title: string;
  channel: 'EMAIL' | 'SMS';
  template: string;
}

export interface WinBackCampaign {
  inactiveDaysThreshold: number;
  discountPercentage: number;
  expiresInDays: number;
  bonusPoints: number;
}

export interface BirthdayReward {
  discountPercentage: number;
  freeService: string;
  validDays: number;
  bonusPoints: number;
}

export interface MembershipRetentionResult {
  renewed: boolean;
  loyaltyBonusPoints: number;
  discountApplied: number;
  nextRenewalDate: Date;
}

export type ClientSegment = 'VIP_LOYAL' | 'AT_RISK_CHURN' | 'NEW_CLIENT' | 'DORMANT' | 'REGULAR';

export interface RetentionRecommendation {
  segment: ClientSegment;
  recommendedAction: string;
  suggestedOffer: string;
}

export class AcquisitionRetentionEngine {
  private referralReward: ReferralReward = { referrerCredit: 15.00, refereeDiscount: 10.00, referrerPoints: 150 };
  
  private onboardingSequence: OnboardingStep[] = [
    { stepNumber: 1, delayHours: 0, title: 'Welcome to FADE', channel: 'SMS', template: 'Welcome to FADE, {name}! Use code FIRSTCUT for $10 off your first grooming session.' },
    { stepNumber: 2, delayHours: 24, title: 'Complete Your Profile', channel: 'EMAIL', template: 'Hi {name}, tell us your preferred hairstyle and barber to personalize your FADE experience.' },
    { stepNumber: 3, delayHours: 72, title: 'Refer a Friend', channel: 'SMS', template: 'Love your fresh look, {name}? Share your code {code} and get $15 credit + 150 points when your friend books!' },
    { stepNumber: 4, delayHours: 168, title: 'First Month Check-in', channel: 'EMAIL', template: 'Hey {name}, ready for your next clean cut? Book now and maintain your fresh style.' }
  ];

  private winBackTiers: WinBackCampaign[] = [
    { inactiveDaysThreshold: 30, discountPercentage: 15, expiresInDays: 7, bonusPoints: 100 },
    { inactiveDaysThreshold: 60, discountPercentage: 25, expiresInDays: 14, bonusPoints: 250 },
    { inactiveDaysThreshold: 90, discountPercentage: 35, expiresInDays: 30, bonusPoints: 500 }
  ];

  /**
   * Generates a unique referral code for a client.
   */
  public generateReferralCode(clientName: string): string {
    const cleanName = clientName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `FADE-${cleanName}-${randomNum}`;
  }

  /**
   * Calculates tiered referral rewards based on referrer's loyalty tier.
   */
  public calculateTieredReferralReward(referrer: Client): ReferralReward {
    let multiplier = 1.0;
    switch (referrer.loyaltyTier) {
      case 'SILVER':
        multiplier = 1.2;
        break;
      case 'GOLD':
        multiplier = 1.5;
        break;
      case 'VIP':
        multiplier = 2.0;
        break;
      default:
        multiplier = 1.0;
    }

    return {
      referrerCredit: Number((this.referralReward.referrerCredit * multiplier).toFixed(2)),
      refereeDiscount: this.referralReward.refereeDiscount,
      referrerPoints: Math.round(this.referralReward.referrerPoints * multiplier)
    };
  }

  /**
   * Processes a referral signup with tiered rewards.
   */
  public processReferral(referrer: Client, newClientName: string, newClientEmail: string, newClientPhone: string): { newClient: Client; updatedReferrer: Client; reward: ReferralReward } {
    const earnedReward = this.calculateTieredReferralReward(referrer);

    const newClient: Client = {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone,
      createdAt: new Date(),
      totalVisits: 0,
      totalSpent: 0,
      referredBy: referrer.referralCode,
      referralCode: this.generateReferralCode(newClientName),
      loyaltyTier: 'BRONZE',
      pointsBalance: 50 // Signup bonus points
    };

    const updatedReferrer: Client = {
      ...referrer,
      pointsBalance: (referrer.pointsBalance || 0) + earnedReward.referrerPoints
    };

    return {
      newClient,
      updatedReferrer,
      reward: earnedReward
    };
  }

  /**
   * Evaluates and assigns loyalty tier based on visits and spent amount.
   */
  public evaluateLoyaltyTier(client: Client): Client {
    let tier: Client['loyaltyTier'] = 'BRONZE';
    if (client.totalVisits >= 20 || client.totalSpent >= 800) {
      tier = 'VIP';
    } else if (client.totalVisits >= 10 || client.totalSpent >= 400) {
      tier = 'GOLD';
    } else if (client.totalVisits >= 5 || client.totalSpent >= 150) {
      tier = 'SILVER';
    }
    return { ...client, loyaltyTier: tier };
  }

  /**
   * Determines if a client qualifies for a win-back campaign based on days since last visit.
   */
  public getWinBackOffer(client: Client, currentDate: Date = new Date()): WinBackCampaign | null {
    if (!client.lastVisitDate) return null;
    const diffTime = Math.abs(currentDate.getTime() - client.lastVisitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let matchingCampaign: WinBackCampaign | null = null;
    for (const campaign of this.winBackTiers) {
      if (diffDays >= campaign.inactiveDaysThreshold) {
        matchingCampaign = campaign;
      }
    }
    return matchingCampaign;
  }

  /**
   * Checks if today matches the client's birthday (month and day) and generates a birthday club reward.
   */
  public checkBirthdayReward(client: Client, currentDate: Date = new Date()): BirthdayReward | null {
    if (!client.birthDate) return null;
    if (
      currentDate.getMonth() === client.birthDate.getMonth() &&
      currentDate.getDate() === client.birthDate.getDate()
    ) {
      return {
        discountPercentage: 20,
        freeService: 'Complimentary Hot Towel Shave',
        validDays: 14,
        bonusPoints: 200
      };
    }
    return null;
  }

  /**
   * Processes monthly membership renewal and calculates retention loyalty perks.
   */
  public processMembershipRenewal(client: Client, monthsActive: number, currentDate: Date = new Date()): MembershipRetentionResult {
    const nextRenewal = new Date(currentDate.getTime());
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);

    let loyaltyBonus = 100;
    let discount = 0.0;

    if (monthsActive >= 6) {
      loyaltyBonus = 250;
      discount = 0.10; // 10% loyalty renewal discount
    } else if (monthsActive >= 3) {
      loyaltyBonus = 150;
      discount = 0.05;
    }

    return {
      renewed: true,
      loyaltyBonusPoints: loyaltyBonus,
      discountApplied: discount,
      nextRenewalDate: nextRenewal
    };
  }

  /**
   * Classifies client into behavioral retention segments and provides automated marketing recommendations.
   */
  public classifyClientSegment(client: Client, currentDate: Date = new Date()): RetentionRecommendation {
    const daysSinceCreation = Math.ceil(Math.abs(currentDate.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    let daysSinceLastVisit = daysSinceCreation;
    if (client.lastVisitDate) {
      daysSinceLastVisit = Math.ceil(Math.abs(currentDate.getTime() - client.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (client.loyaltyTier === 'VIP' || client.totalVisits >= 15) {
      return {
        segment: 'VIP_LOYAL',
        recommendedAction: 'Invite to exclusive VIP pre-release booking slots and complimentary beard trim upgrade.',
        suggestedOffer: 'Complimentary Grooming Upgrade'
      };
    }

    if (daysSinceCreation <= 30 && client.totalVisits <= 2) {
      return {
        segment: 'NEW_CLIENT',
        recommendedAction: 'Send onboarding sequence step 3 & 4 with referral incentives.',
        suggestedOffer: '$10 Off Second Visit'
      };
    }

    if (daysSinceLastVisit >= 60) {
      return {
        segment: 'DORMANT',
        recommendedAction: 'Trigger high-value win-back email and SMS campaign with 25% discount.',
        suggestedOffer: '25% Win-Back Discount + 250 Bonus Points'
      };
    }

    if (daysSinceLastVisit >= 30) {
      return {
        segment: 'AT_RISK_CHURN',
        recommendedAction: 'Send targeted re-engagement SMS with 15% discount.',
        suggestedOffer: '15% Return Discount'
      };
    }

    return {
      segment: 'REGULAR',
      recommendedAction: 'Maintain regular notification cadence and encourage referral sharing.',
      suggestedOffer: 'Standard Referral Rewards'
    };
  }

  /**
   * Gets the onboarding sequence steps.
   */
  public getOnboardingSequence(): OnboardingStep[] {
    return this.onboardingSequence;
  }

  /**
   * Sets custom referral rewards.
   */
  public setReferralReward(reward: ReferralReward): void {
    this.referralReward = reward;
  }

  public getReferralReward(): ReferralReward {
    return this.referralReward;
  }
}
