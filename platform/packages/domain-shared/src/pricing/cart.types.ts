import type { AddOnItem, AddOnRecommendation } from './service.types';

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
