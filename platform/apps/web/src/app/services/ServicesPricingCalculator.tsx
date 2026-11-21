'use client';

import { useState } from 'react';
import {
  BEARD_CARE,
  SHAMPOO_RITUAL,
  calculateBundleTotals,
  type ServiceItem,
} from './service-pricing-calculations';
import { ServiceOptionButton } from './ServiceOptionButton';
import { PricingSummary } from './PricingSummary';

interface ServicesPricingCalculatorProps {
  services: ServiceItem[];
}

export function ServicesPricingCalculator({ services }: ServicesPricingCalculatorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [includeBeardCare, setIncludeBeardCare] = useState(false);
  const [includeShampoo, setIncludeShampoo] = useState(true);

  const toggleService = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sId) => sId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const totals = calculateBundleTotals({
    services,
    selectedIds,
    includeBeardCare,
    includeShampoo,
  });

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface-sunken p-6 md:p-10 shadow-lg relative overflow-hidden">
      <div className="absolute right-0 top-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-3 mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 border border-accent/30 px-3.5 py-1.5 text-caption font-semibold text-accent w-fit">
          ✨ Інтерактивний конструктор комплексу та калькулятор знижок
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-fg">
          Скомбінуйте свій ідеальний догляд з вигодою до 12%
        </h2>
        <p className="text-body text-fg-secondary max-w-2xl">
          Оберіть стрижку та додаткові преміум-ритуали. При бронюванні комплексу з 2 і більше послуг
          спрацьовує автоматична знижка комбо-пакету.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <span className="text-caption font-semibold uppercase tracking-wider text-fg-secondary">
            1. Оберіть основну послугу:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.slice(0, 4).map((service) => (
              <ServiceOptionButton
                key={service.id}
                name={service.name}
                duration={service.duration}
                price={service.price}
                selected={selectedIds.includes(service.id)}
                onToggle={() => toggleService(service.id)}
              />
            ))}
          </div>

          <span className="text-caption font-semibold uppercase tracking-wider text-fg-secondary pt-3">
            2. Додайте фірмові ритуали догляду:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ServiceOptionButton
              name={BEARD_CARE.name}
              duration={BEARD_CARE.duration}
              price={BEARD_CARE.price}
              selected={includeBeardCare}
              onToggle={() => setIncludeBeardCare(!includeBeardCare)}
            />
            <ServiceOptionButton
              name={SHAMPOO_RITUAL.name}
              duration={SHAMPOO_RITUAL.duration}
              price={SHAMPOO_RITUAL.price}
              selected={includeShampoo}
              onToggle={() => setIncludeShampoo(!includeShampoo)}
            />
          </div>
        </div>

        <PricingSummary
          totals={totals}
          includeBeardCare={includeBeardCare}
          includeShampoo={includeShampoo}
        />
      </div>
    </section>
  );
}
