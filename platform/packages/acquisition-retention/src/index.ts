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


/**
 * FADE Marketing Experience & Brand Impact Campaign & Widget Engine
 */
export interface PromotionalBanner {
  id: string;
  headline: string;
  subheadline: string;
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  active: boolean;
}

export interface TestimonialHighlight {
  id: string;
  clientName: string;
  clientTitle: string;
  quote: string;
  rating: number;
  service: string;
  verified: boolean;
}

export interface TrustIndicator {
  icon: string;
  title: string;
  description: string;
  metric: string;
}

export class MarketingExperienceEngine {
  private promotionalBanners: PromotionalBanner[] = [
    {
      id: 'promo-spring-2026',
      headline: 'Elevate Your Grooming Experience',
      subheadline: 'Book your precision haircut today and receive a complimentary beard styling upgrade.',
      badgeText: 'LIMITED TIME OFFER',
      ctaText: 'Claim Free Upgrade',
      ctaLink: '#booking',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      active: true
    },
    {
      id: 'promo-vip-launch',
      headline: 'Join FADE VIP Club',
      subheadline: 'Earn 2x loyalty points, priority booking slots, and exclusive member-only grooming perks.',
      badgeText: 'VIP MEMBERSHIP',
      ctaText: 'Explore VIP Benefits',
      ctaLink: '#loyalty',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      active: true
    }
  ];

  private testimonials: TestimonialHighlight[] = [
    {
      id: 'test-1',
      clientName: 'Marcus Vance',
      clientTitle: 'Tech Entrepreneur',
      quote: 'FADE provides unmatched precision and luxury. The online booking and master barbers make every visit effortless.',
      rating: 5,
      service: 'Executive Haircut & Hot Towel Shave',
      verified: true
    },
    {
      id: 'test-2',
      clientName: 'Julian Sterling',
      clientTitle: 'Creative Director',
      quote: 'The attention to detail and ambiance at FADE is top-tier. Best fade in the city, guaranteed.',
      rating: 5,
      service: 'Signature Fade & Beard Sculpting',
      verified: true
    }
  ];

  private trustIndicators: TrustIndicator[] = [
    {
      icon: 'shield-check',
      title: 'Satisfaction Guaranteed',
      description: 'Expert master barbers with 10+ years of precision craftsmanship.',
      metric: '100% Quality'
    },
    {
      icon: 'star',
      title: '5-Star Client Rating',
      description: 'Over 15,000 satisfied gentlemen and professionals styled.',
      metric: '4.98 / 5.0 Rating'
    },
    {
      icon: 'clock',
      title: 'Seamless Booking',
      description: 'Instant online appointments with zero wait times.',
      metric: 'Under 60s Booking'
    }
  ];

  public getActiveBanners(): PromotionalBanner[] {
    return this.promotionalBanners.filter(b => b.active);
  }

  public getTestimonials(): TestimonialHighlight[] {
    return this.testimonials;
  }

  public getTrustIndicators(): TrustIndicator[] {
    return this.trustIndicators;
  }

  public renderPromotionWidget(bannerId: string): string {
    const banner = this.promotionalBanners.find(b => b.id === bannerId);
    if (!banner) return '';
    return `<div class="fade-promo-banner" style="background: ${banner.bgGradient}; padding: 16px 24px; border-radius: 12px; color: #ffffff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
      <div>
        <span style="background: #eab308; color: #000; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${banner.badgeText}</span>
        <h3 style="margin: 8px 0 4px 0; font-size: 18px; font-weight: 600;">${banner.headline}</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.85;">${banner.subheadline}</p>
      </div>
      <a href="${banner.ctaLink}" style="background: #ffffff; color: #0f172a; padding: 10px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: all 0.2s;">${banner.ctaText}</a>
    </div>`;
  }
}
