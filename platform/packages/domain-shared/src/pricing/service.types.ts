export type ServiceTier = 'standard' | 'premium' | 'vip' | 'luxury';

export interface ServicePricingConfig {
  serviceId: string;
  serviceName: string;
  basePriceCents: number;
  tierMultipliers: Record<ServiceTier, number>;
  peakHourMultiplier: number;
  weekendMultiplier: number;
}

export interface BundleItem {
  serviceId: string;
  name: string;
  regularPriceCents: number;
}

export interface ServiceBundle {
  bundleId: string;
  name: string;
  description: string;
  items: BundleItem[];
  discountPercentage: number;
  bundledPriceCents: number;
  savingsCents: number;
}

export interface AddOnItem {
  addOnId: string;
  name: string;
  priceCents: number;
  category: 'grooming' | 'styling' | 'beverage' | 'express';
  historicalAttachRate: number;
}

export interface AddOnRecommendation {
  addOnId: string;
  name: string;
  priceCents: number;
  relevanceScore: number;
  estimatedAttachRate: number;
}

export interface DynamicPriceInput {
  service: ServicePricingConfig;
  tier: ServiceTier;
  isPeakHour: boolean;
  isWeekend: boolean;
}

export interface ServiceBundleInput {
  primaryServiceId: string;
  primaryServiceName: string;
  primaryPriceCents: number;
  availableAddOns: AddOnItem[];
}

export interface PricingOptimizationInput {
  service: ServicePricingConfig;
  selectedTier: ServiceTier;
  isPeakHour: boolean;
  isWeekend: boolean;
  activeAddOns?: string[];
  availableAddOns: AddOnItem[];
  clientLoyaltyScore?: number;
}

export interface PricingOptimizationResult {
  serviceId: string;
  serviceName: string;
  basePriceCents: number;
  adjustedServicePriceCents: number;
  appliedMultipliers: {
    tier: ServiceTier;
    tierMultiplier: number;
    peakMultiplier: number;
    weekendMultiplier: number;
  };
  recommendedBundles: ServiceBundle[];
  recommendedAddOns: AddOnRecommendation[];
  subtotalCents: number;
  totalDiscountCents: number;
  finalPriceCents: number;
  projectedRevenueLiftPercentage: number;
}
