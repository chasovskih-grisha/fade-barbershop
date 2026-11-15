export interface ServiceItem {
  id: string;
  name: string;
  basePrice: number;
  durationMinutes: number;
  category: 'haircut' | 'beard' | 'combo' | 'treatment' | 'addon';
}

export interface BundlePackage {
  id: string;
  name: string;
  description: string;
  services: string[]; // service IDs
  discountPercentage: number;
  featured: boolean;
}

export interface PeakPricingRule {
  dayOfWeek: number; // 0 = Sunday, 5 = Friday, 6 = Saturday
  startHour: number;
  endHour: number;
  multiplier: number; // e.g. 1.15 for +15% peak demand
}

export interface AddOnRecommendation {
  addOnId: string;
  name: string;
  price: number;
  attachProbability: number;
  category: string;
}

export interface PricingEngineConfig {
  peakRules: PeakPricingRule[];
  bundles: BundlePackage[];
  addOns: AddOnRecommendation[];
}

export class RevenuePricingEngine {
  private config: PricingEngineConfig;

  constructor(config: PricingEngineConfig) {
    this.config = config;
  }

  /**
   * Calculate dynamic price for a service given appointment date/time
   */
  public calculateDynamicPrice(basePrice: number, appointmentDate: Date): { finalPrice: number; multiplier: number; isPeak: boolean } {
    const day = appointmentDate.getDay();
    const hour = appointmentDate.getHours();

    let applicableMultiplier = 1.0;
    let isPeak = false;

    for (const rule of this.config.peakRules) {
      if (rule.dayOfWeek === day && hour >= rule.startHour && hour < rule.endHour) {
        applicableMultiplier = Math.max(applicableMultiplier, rule.multiplier);
        isPeak = true;
      }
    }

    const finalPrice = Math.round(basePrice * applicableMultiplier * 100) / 100;
    return { finalPrice, multiplier: applicableMultiplier, isPeak };
  }

  /**
   * Evaluate a bundle price compared to individual services
   */
  public evaluateBundle(bundleId: string, servicesMap: Map<string, ServiceItem>): { bundlePrice: number; totalIndividualPrice: number; savings: number } | null {
    const bundle = this.config.bundles.find(b => b.id === bundleId);
    if (!bundle) return null;

    let totalIndividualPrice = 0;
    for (const sId of bundle.services) {
      const s = servicesMap.get(sId);
      if (s) {
        totalIndividualPrice += s.basePrice;
      }
    }

    const discountMultiplier = (100 - bundle.discountPercentage) / 100;
    const bundlePrice = Math.round(totalIndividualPrice * discountMultiplier * 100) / 100;
    const savings = Math.round((totalIndividualPrice - bundlePrice) * 100) / 100;

    return { bundlePrice, totalIndividualPrice, savings };
  }

  /**
   * Get intelligent add-on recommendations sorted by revenue potential (price * attachProbability)
   */
  public getTopAddOnRecommendations(limit: number = 3): AddOnRecommendation[] {
    const sorted = [...this.config.addOns].sort((a, b) => {
      const revA = a.price * a.attachProbability;
      const revB = b.price * b.attachProbability;
      return revB - revA;
    });
    return sorted.slice(0, limit);
  }

  /**
   * Calculate optimized total revenue for a booking with bundle and add-ons
   */
  public calculateCartTotal(selectedServiceIds: string[], selectedAddOnIds: string[], appointmentDate: Date, servicesMap: Map<string, ServiceItem>, addOnsMap: Map<string, AddOnRecommendation>): { subtotal: number; dynamicTotal: number; addOnsTotal: number; finalTotal: number; appliedSavings: number } {
    let subtotal = 0;
    let dynamicTotal = 0;

    for (const sId of selectedServiceIds) {
      const s = servicesMap.get(sId);
      if (s) {
        subtotal += s.basePrice;
        const dyn = this.calculateDynamicPrice(s.basePrice, appointmentDate);
        dynamicTotal += dyn.finalPrice;
      }
    }

    let addOnsTotal = 0;
    for (const aId of selectedAddOnIds) {
      const a = addOnsMap.get(aId);
      if (a) {
        addOnsTotal += a.price;
      }
    }

    // Check if selected services match any bundle
    let appliedSavings = 0;
    for (const bundle of this.config.bundles) {
      const matchesAll = bundle.services.every(sId => selectedServiceIds.includes(sId)) && bundle.services.length === selectedServiceIds.length;
      if (matchesAll) {
        const evalResult = this.evaluateBundle(bundle.id, servicesMap);
        if (evalResult) {
          appliedSavings = evalResult.savings;
          break;
        }
      }
    }

    const finalTotal = Math.max(0, (dynamicTotal - appliedSavings) + addOnsTotal);

    return {
      subtotal,
      dynamicTotal,
      addOnsTotal,
      finalTotal: Math.round(finalTotal * 100) / 100,
      appliedSavings: Math.round(appliedSavings * 100) / 100
    };
  }
}
