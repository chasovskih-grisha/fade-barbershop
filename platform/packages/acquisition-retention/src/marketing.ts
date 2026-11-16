/**
 * FADE Marketing Experience & Brand Impact Campaign & Widget Engine
 * Implements high-converting promotional banners, social proof badges, interactive trust indicators,
 * and conversion catalysts across platform services.
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
  avatarUrl?: string;
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

  /**
   * Retrieves active promotional banners for marketing placement.
   */
  public getActiveBanners(): PromotionalBanner[] {
    return this.promotionalBanners.filter(b => b.active);
  }

  /**
   * Retrieves verified testimonials for social proof.
   */
  public getTestimonials(): TestimonialHighlight[] {
    return this.testimonials;
  }

  /**
   * Retrieves trust indicators to boost user confidence and conversion.
   */
  public getTrustIndicators(): TrustIndicator[] {
    return this.trustIndicators;
  }

  /**
   * Generates promotional campaign HTML widget string for cross-page integration.
   */
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
