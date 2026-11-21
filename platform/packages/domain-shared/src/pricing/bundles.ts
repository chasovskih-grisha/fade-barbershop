import type { AddOnItem, BundleItem, ServiceBundle, ServiceBundleInput } from './service.types';

interface BundleDraft {
  bundleId: string;
  name: string;
  description: string;
  discountPercentage: number;
  addOns: AddOnItem[];
}

function buildBundle(input: ServiceBundleInput, draft: BundleDraft): ServiceBundle {
  const primaryItem: BundleItem = {
    serviceId: input.primaryServiceId,
    name: input.primaryServiceName,
    regularPriceCents: input.primaryPriceCents,
  };
  const items = [
    primaryItem,
    ...draft.addOns.map((addOn) => ({
      serviceId: addOn.addOnId,
      name: addOn.name,
      regularPriceCents: addOn.priceCents,
    })),
  ];
  const regularTotal = items.reduce((sum, item) => sum + item.regularPriceCents, 0);
  const bundledPriceCents = Math.round(regularTotal * (1 - draft.discountPercentage / 100));

  return {
    bundleId: draft.bundleId,
    name: draft.name,
    description: draft.description,
    items,
    discountPercentage: draft.discountPercentage,
    bundledPriceCents,
    savingsCents: regularTotal - bundledPriceCents,
  };
}

/**
 * Creates curated service bundles with intelligent discount pricing.
 */
export function generateServiceBundles(input: ServiceBundleInput): ServiceBundle[] {
  const { availableAddOns } = input;
  if (availableAddOns.length === 0) return [];

  const bundles: ServiceBundle[] = [];
  const groomingAddOns = availableAddOns.filter(
    (addOn) => addOn.category === 'grooming' || addOn.category === 'styling'
  );
  if (groomingAddOns.length >= 2) {
    bundles.push(
      buildBundle(input, {
        bundleId: 'bundle-executive-package',
        name: 'Executive Grooming Package',
        description:
          'Signature haircut combined with premium grooming add-ons for the ultimate polish.',
        discountPercentage: 15,
        addOns: groomingAddOns.slice(0, 2),
      })
    );
  }

  const expressAddOns = availableAddOns.filter(
    (addOn) => addOn.category === 'express' || addOn.category === 'beverage'
  );
  const firstExpress = expressAddOns[0];
  if (firstExpress) {
    bundles.push(
      buildBundle(input, {
        bundleId: 'bundle-express-refresh',
        name: 'Express Refresh Bundle',
        description: 'Core service paired with a refreshing beverage or express touch-up.',
        discountPercentage: 10,
        addOns: [firstExpress],
      })
    );
  }

  return bundles;
}
