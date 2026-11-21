export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export const BEARD_CARE = { name: 'Моделювання бороди', price: 350, duration: 30 };
export const SHAMPOO_RITUAL = {
  name: 'СПА-миття та масаж голови',
  price: 150,
  duration: 15,
};

export interface BundleInput {
  services: ServiceItem[];
  selectedIds: string[];
  includeBeardCare: boolean;
  includeShampoo: boolean;
}

export interface BundleTotals {
  selectedServices: ServiceItem[];
  baseTotal: number;
  hasBundle: boolean;
  discount: number;
  finalTotal: number;
  totalDuration: number;
}

/** Computes bundle pricing: 12% off when two or more items are selected. */
export function calculateBundleTotals({
  services,
  selectedIds,
  includeBeardCare,
  includeShampoo,
}: BundleInput): BundleTotals {
  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const itemCount = selectedServices.length + Number(includeBeardCare) + Number(includeShampoo);
  const baseTotal =
    selectedServices.reduce((sum, s) => sum + s.price, 0) +
    (includeBeardCare ? BEARD_CARE.price : 0) +
    (includeShampoo ? SHAMPOO_RITUAL.price : 0);
  const hasBundle = itemCount >= 2;
  const discount = hasBundle ? Math.round(baseTotal * 0.12) : 0;
  const totalDuration =
    selectedServices.reduce((sum, s) => sum + s.duration, 0) +
    (includeBeardCare ? BEARD_CARE.duration : 0) +
    (includeShampoo ? SHAMPOO_RITUAL.duration : 0);

  return {
    selectedServices,
    baseTotal,
    hasBundle,
    discount,
    finalTotal: baseTotal - discount,
    totalDuration,
  };
}
