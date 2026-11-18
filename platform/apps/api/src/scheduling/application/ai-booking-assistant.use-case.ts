// AI-powered Booking Assistant (T-???)
// Suggests optimal barbers based on history, generates promotional offers,
// auto-responds to common client questions, and provides booking recommendations.
// Depends on T-090 DiscountCalculator and T-105 location data.

import { Booking, BookingRepository } from '../domain/booking';
import { DiscountCalculator, type DiscountInput } from '../../discounts/domain/discount-calculator';
import { LocationService } from '../../locations/location.service';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';
import type { BookingRiskAssessment, BookingRiskSignals, RiskTier, ScoredBooking } from '../domain/booking-risk-score';

/** Recommend optimal barbers for a client based on their history.
 * Analyzes past bookings to find barbers the client has visited most,
 * barbers with highest satisfaction, or barbers matching the client's
 * preferred service patterns.
 */
export interface BarberSuggestion {
  barberId: string;
  name: string;
  score: number; // 0-100, higher is better
  reason: string;
  visitCount: number;
  lastVisit?: Date;
}

/** Promotional offer generated for a client based on their profile and history.
 * Uses the DiscountCalculator (T-090) to compute applicable discounts.
 */
export interface PromotionalOffer {
  id: string;
  title: string;
  description: string;
  discount: AppliedDiscount;
  applicableServices: string[]; // service IDs
  expiresAt?: Date;
  conditions: string; // e.g., "first visit", "loyalty tier 2", "seasonal"
}

/** Auto-response for a common client question.
 * Maps question keywords to predefined responses.
 */
export interface AutoResponse {
  keyword: string;
  response: string;
  priority: number; // higher = matches first
}

/** Booking recommendation based on client history, preferences, and availability.
 * Combines barber suggestions, promotional offers, and optimal timing.
 */
export interface BookingRecommendation {
  suggestionId: string;
  barberSuggestion: BarberSuggestion;
  promotionalOffer?: PromotionalOffer;
  optimalTime?: { start: Date; end: Date };
  reason: string;
  confidence: number; // 0-100
}

/** AI Booking Assistant deps */
export interface AiBookingAssistantDeps {
  bookingRepo: BookingRepository;
  discountCalculator: DiscountCalculator;
  locationService: LocationService;
}

/**
 * Suggests optimal barbers for a client based on their visit history.
 * Analyzes past bookings to recommend barbers the client has had good experiences with.
 */
export class AiBookingAssistant {
  private deps: AiBookingAssistantDeps;

  constructor(deps: AiBookingAssistantDeps) {
    this.deps = deps;
  }

  /**
   * Get barber suggestions for a client.
   * @param clientId The client's ID
   * @param locationId Optional location filter
   * @returns Array of barber suggestions sorted by score (highest first)
   */
  async suggestOptimalBarbers(clientId: string, locationId?: string): Promise<BarberSuggestion[]> {
    // Get client's past bookings
    const bookings = await this.deps.bookingRepo.findByClientId(clientId);

    // Analyze barber visit patterns
    const barberVisits = new Map<string, { count: number; lastVisit: Date; serviceIds: Set<string> }>();

    for (const booking of bookings) {
      const barberId = booking.barberId;
      if (!barberVisits.has(barberId)) {
        barberVisits.set(barberId, { count: 0, lastVisit: new Date(0), serviceIds: new Set() });
      }
      const data = barberVisits.get(barberId);
      data.count++;
      if (booking.start > data.lastVisit) {
        data.lastVisit = booking.start;
      }
      if (booking.serviceId) {
        data.serviceIds.add(booking.serviceId);
      }
    }

    // Build suggestions
    const now = new Date();
    const suggestions: BarberSuggestion[] = [];

    for (const [barberId, data] of barberVisits) {
      const visitRatio = data.count / Math.max(1, (now.getTime() - data.lastVisit.getTime()) / (30 * 24 * 60 * 60 * 1000)); // visits per month
      const recencyScore = Math.min(100, (now.getTime() - data.lastVisit.getTime()) / (7 * 24 * 60 * 60 * 1000) * 50); // recency 0-50
      const frequencyScore = Math.min(50, visitRatio * 10); // frequency 0-50
      const totalScore = Math.min(100, recencyScore + frequencyScore);

      suggestions.push({
        barberId,
        name: `Barber ${barberId}`, // Will be resolved later
        score: totalScore,
        reason: this.generateSuggestionReason(data),
        visitCount: data.count,
        lastVisit: data.lastVisit,
      });
    }

    // Sort by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);

    return suggestions;
  }

  private generateSuggestionReason(data: { count: number; lastVisit: Date; serviceIds: Set<string> }): string {
    if (data.count >= 5) {
      return `Visited ${data.count} times - your preferred barber`;
    }
    if (data.count >= 3) {
      return `Good history with ${data.count} visits`;
    }
    if (data.count === 1) {
      return `Single visit - enjoyed your experience`;
    }
    return `Visit history`;
  }

  /**
   * Generate a promotional offer for a client based on their profile and history.
   * Uses the DiscountCalculator (T-090) to compute applicable discounts.
   */
  async generatePromotionalOffer(
    clientId: string,
    serviceId?: string,
    locationId?: string
  ): Promise<PromotionalOffer | null> {
    // Get client's past bookings to understand their history
    const bookings = await this.deps.bookingRepo.findByClientId(clientId);

    // Determine if this is a first visit, returning client, etc.
    const firstVisit = bookings.length === 0;
    const visitCount = bookings.length;

    // Base discount input for the DiscountCalculator
    const baseInput: DiscountInput = {
      agreedPrice: 0, // Will be set per service
      rules: [],
      vip: undefined,
      promoCode: undefined,
      capPercent: 30, // default cap
    };

    let discount: AppliedDiscount | undefined;

    if (firstVisit) {
      // First visit promotion: 15% off
      discount = {
        type: 'rule',
        sourceId: '11111111-1111-1111-1111-111111111111', // UUID per ADR 0021
        amount: 0, // Will be calculated per price
      };
    } else if (visitCount >= 7) {
      // Loyalty milestone: free visit or substantial discount
      discount = {
        type: 'vip',
        sourceId: '22222222-2222-2222-2222-222222222222', // UUID per ADR 0021
        amount: 0,
      };
    } else {
      // Returning client: small discount or rule-based
      const bestRule = this.findBestRuleForClient(bookings);
      if (bestRule) {
        discount = bestRule;
      }
    }

    if (!discount) {
      return null;
    }

    // Calculate the actual discount amount
    const agreedPrice = serviceId ? 100 : 50; // Default price if no service specified
    const input: DiscountInput = {
      ...baseInput,
      agreedPrice,
      rules: discount.type === 'rule' ? [discount] : undefined,
      vip: discount.type === 'vip' ? discount : undefined,
    };

    const priceBreakdown = DiscountCalculator.calculateDiscounts(input);
    const appliedDiscount = priceBreakdown.appliedDiscounts.find(
      (d) => d.type === discount.type && d.sourceId === discount.sourceId
    );

    if (!appliedDiscount) {
      return null;
    }

    return {
      id: `promo_${clientId}_${Date.now()}`,
      title: this.generatePromotionalTitle(discount.type),
      description: this.generatePromotionalDescription(discount.type, visitCount),
      discount: appliedDiscount,
      applicableServices: serviceId ? [serviceId] : [],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      conditions: firstVisit
        ? 'First visit promotion'
        : visitCount >= 7
          ? 'Loyalty milestone (7+ visits)'
          : 'Returning client',
    };
  }

  private findBestRuleForClient(bookings: any[]): AppliedDiscount | null {
    // Analyze bookings to find the best rule
    // For simplicity, return a rule if the client has specific patterns
    const hasWeekendBookings = bookings.some((b) => {
      const day = b.start.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });

    if (hasWeekendBookings) {
      return {
        type: 'rule',
        sourceId: '33333333-3333-3333-3333-333333333333', // UUID per ADR 0021
        amount: 0, // Will be calculated
      };
    }

    return null;
  }

  private generatePromotionalTitle(discountType: string): string {
    switch (discountType) {
      case 'rule':
        return 'Special Offer';
      case 'vip':
        return 'Loyalty Reward';
      case 'promo_code':
        return 'Promo Code Discount';
      default:
        return 'Special Offer';
    }
  }

  private generatePromotionalDescription(
    discountType: string,
    visitCount: number
  ): string {
    switch (discountType) {
      case 'rule':
        return visitCount > 0
          ? `Enjoy a special discount on your next visit!`
          : 'Welcome discount for your first visit';
      case 'vip':
        return visitCount >= 7
          ? `Congratulations on reaching 7 visits! Enjoy a free visit on your next booking.`
          : `You're ${visitCount} visits away from a free visit!`;
      case 'promo_code':
        return 'Enter promo code at checkout for a discount';
      default:
        return 'Special offer available';
    }
  }

  /**
   * Auto-respond to a common client question.
   * Maps question keywords to predefined responses.
   */
  autoRespond(question: string): string | null {
    const responses: AutoResponse[] = [
      { keyword: 'hours', response: 'Our working hours are 9:00 AM to 9:00 PM, daily.', priority: 10 },
      { keyword: 'price', response: 'Prices start at $50 for a standard haircut. Exact price depends on the service and barber.', priority: 10 },
      { keyword: 'appointment', response: 'You can book an appointment through our website or mobile app. Would you like me to help you find available slots?', priority: 10 },
      { keyword: 'cancel', response: 'You can cancel or reschedule your appointment up to 24 hours in advance. Just let me know!', priority: 10 },
      { keyword: 'loyalty', response: 'You earn 1 point per visit. After 7 visits, you get a free visit! Check your progress in the app.', priority: 10 },
      { keyword: 'waitlist', response: 'Join our waitlist for cancellations. You\'ll be notified if a slot opens up.', priority: 10 },
      { keyword: 'barber', response: 'I can suggest the best barber based on your visit history. Would you like a recommendation?', priority: 10 },
      { keyword: 'discount', response: 'We offer various discounts for first visitors, loyalty members, and seasonal promotions. Ask me about current offers!', priority: 10 },
    ];

    const lowerQuestion = question.toLowerCase();

    // Sort by priority (higher first) and find the best match
    const sorted = responses.sort((a, b) => b.priority - a.priority);

    for (const response of sorted) {
      if (lowerQuestion.includes(response.keyword)) {
        return response.response;
      }
    }

    // No match found, return null
    return null;
  }

  /**
   * Provide a booking recommendation combining barber suggestions,
   * promotional offers, and optimal timing.
   */
  async provideBookingRecommendation(
    clientId: string,
    locationId?: string,
    serviceId?: string
  ): Promise<BookingRecommendation | null> {
    // Get barber suggestions
    const barberSuggestions = await this.suggestOptimalBarbers(clientId, locationId);

    if (barberSuggestions.length === 0) {
      return null;
    }

    // Get promotional offer
    const promotionalOffer = await this.generatePromotionalOffer(clientId, serviceId, locationId);

    // Get the top barber suggestion
    const topBarber = barberSuggestions[0];

    // Generate a suggestion ID
    const suggestionId = `rec_${clientId}_${Date.now()}`;

    // Determine optimal time based on barber's availability and client history
    // For now, use a generic optimal time recommendation
    const optimalTime = this.suggestOptimalTime(clientId, topBarber.barberId, locationId);

    // Build the reason
    const reason = this.generateRecommendationReason(
      topBarber,
      promotionalOffer,
      optimalTime
    );

    return {
      suggestionId,
      barberSuggestion: topBarber,
      promotionalOffer,
      optimalTime,
      reason,
      confidence: topBarber.score,
    };
  }

  private suggestOptimalTime(
    clientId: string,
    barberId: string,
    locationId?: string
  ): { start: Date; end: Date } | null {
    // In a real implementation, this would check the barber's schedule
    // and the client's preferences/history
    // For now, return a generic optimal time (Tuesday/Wednesday mornings)
    const now = new Date();
    const day = now.getDate();

    // Pick a date in the near future, preferably Tuesday or Wednesday
    const targetDate = new Date();
    targetDate.setDate(day + (2 - now.getDay() + 7) % 7); // Next Tuesday

    const start = new Date(targetDate);
    start.setHours(9, 0, 0, 0); // 9 AM

    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour slot

    return { start, end };
  }

  private generateRecommendationReason(
    barber: BarberSuggestion,
    promotionalOffer?: PromotionalOffer,
    optimalTime?: { start: Date; end: Date }
  ): string {
    const parts: string[] = [];

    if (barber.score >= 80) {
      parts.push(`Highly recommended barber (${barber.visitCount} visits history)`);
    } else if (barber.score >= 50) {
      parts.push(`Good match based on your history (${barber.visitCount} visits)`);
    } else {
      parts.push(`Suggested barber (${barber.visitCount} visits)`);
    }

    if (promotionalOffer) {
      parts.push(promotionalOffer.conditions);
    }

    if (optimalTime) {
      parts.push(`Available around ${optimalTime.start.toLocaleDateString()}`);
    }

    return parts.join('. ');
  }
}

/** Factory function to create an AiBookingAssistant instance */
export function createAiBookingAssistant(
  deps: AiBookingAssistantDeps
): AiBookingAssistant {
  return new AiBookingAssistant(deps);
}