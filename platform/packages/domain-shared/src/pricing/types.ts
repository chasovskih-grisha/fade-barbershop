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
  discountPercentage: number; // e.g., 15 for 15% off
  bundledPriceCents: number;
  savingsCents: number;
}

export interface AddOnItem {
  addOnId: string;
  name: string;
  priceCents: number;
  category: 'grooming' | 'styling' | 'beverage' | 'express';
  historicalAttachRate: number; // e.g., 0.25 for 25%
}

export interface AddOnRecommendation {
  addOnId: string;
  name: string;
  priceCents: number;
  relevanceScore: number;
  estimatedAttachRate: number;
}

export interface PricingOptimizationInput {
  service: ServicePricingConfig;
  selectedTier: ServiceTier;
  isPeakHour: boolean;
  isWeekend: boolean;
  activeAddOns?: string[]; // IDs of add-ons currently attached
  availableAddOns: AddOnItem[];
  clientLoyaltyScore?: number; // 0-100
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

export interface PriceElasticitySimulationInput {
  basePriceCents: number;
  priceElasticityCoefficient?: number; // default -1.3 (barbershop demand sensitivity)
  baselineMonthlyVolume?: number; // default 350
  testMultipliers?: number[]; // default [1.0, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.40, 1.50]
}

export interface ElasticitySimulationPoint {
  multiplier: number;
  priceCents: number;
  projectedVolume: number;
  projectedMonthlyRevenueCents: number;
  demandChangePercent: number;
  revenueChangePercent: number;
}

export interface PriceElasticitySimulationResult {
  basePriceCents: number;
  baselineMonthlyRevenueCents: number;
  optimalMultiplier: number;
  optimalPriceCents: number;
  maxMonthlyRevenueCents: number;
  simulationPoints: ElasticitySimulationPoint[];
  recommendationSummary: string;
}

export interface CartOptimizationInput {
  baseServicePriceCents: number;
  selectedAddOnIds: string[];
  availableAddOns: AddOnItem[];
  clientLoyaltyScore?: number;
}

export interface CartOptimizationResult {
  baseServicePriceCents: number;
  selectedAddOns: AddOnItem[];
  rawAddOnsTotalCents: number;
  tieredDiscountPercentage: number;
  discountAmountCents: number;
  finalAddOnTotalCents: number;
  finalCartTotalCents: number;
  recommendedNextAddOn?: AddOnRecommendation;
}
