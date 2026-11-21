import type { AddOnItem, ServicePricingConfig } from './types';

export const mockService: ServicePricingConfig = {
  serviceId: 'srv-signature-cut',
  serviceName: 'Signature Haircut',
  basePriceCents: 4500,
  tierMultipliers: {
    standard: 1.0,
    premium: 1.25,
    vip: 1.5,
    luxury: 2.0,
  },
  peakHourMultiplier: 1.2,
  weekendMultiplier: 1.15,
};

export const mockAddOns: AddOnItem[] = [
  {
    addOnId: 'addon-beard-trim',
    name: 'Beard Trim & Shape',
    priceCents: 2000,
    category: 'grooming',
    historicalAttachRate: 0.35,
  },
  {
    addOnId: 'addon-scalp-massage',
    name: 'Revitalizing Scalp Treatment',
    priceCents: 1500,
    category: 'grooming',
    historicalAttachRate: 0.2,
  },
  {
    addOnId: 'addon-craft-beverage',
    name: 'Artisan Craft Beverage',
    priceCents: 500,
    category: 'beverage',
    historicalAttachRate: 0.55,
  },
];
