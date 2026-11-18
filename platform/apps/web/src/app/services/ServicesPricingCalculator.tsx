'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

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

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const baseTotal = selectedServices.reduce((sum, s) => sum + s.price, 0) + (includeBeardCare ? 350 : 0) + (includeShampoo ? 150 : 0);
  
  // Calculate bundle discount: 12% off if 2 or more services/add-ons selected
  const hasBundle = selectedServices.length + (includeBeardCare ? 1 : 0) + (includeShampoo ? 1 : 0) >= 2;
  const discount = hasBundle ? Math.round(baseTotal * 0.12) : 0;
  const finalTotal = baseTotal - discount;
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0) + (includeBeardCare ? 30 : 0) + (includeShampoo ? 15 : 0);

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
          Оберіть стрижку та додаткові преміум-ритуали. При бронюванні комплексу з 2 і більше послуг спрацьовує автоматична знижка комбо-пакету.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Services checklist */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <span className="text-caption font-semibold uppercase tracking-wider text-fg-secondary">
            1. Оберіть основну послугу:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.slice(0, 4).map((service) => {
              const isSelected = selectedIds.includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  type="button"
                  className={`flex flex-col text-left p-4 rounded-card border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                      : 'border-line bg-surface hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-display font-bold text-fg text-body">{service.name}</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isSelected ? 'bg-accent text-accent-fg' : 'border border-line'}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full text-caption text-fg-secondary">
                    <span>{service.duration} хв</span>
                    <span className="font-semibold text-fg">{service.price} ₴</span>
                  </div>
                </button>
              );
            })}
          </div>

          <span className="text-caption font-semibold uppercase tracking-wider text-fg-secondary pt-3">
            2. Додайте фірмові ритуали догляду:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setIncludeBeardCare(!includeBeardCare)}
              type="button"
              className={`flex flex-col text-left p-4 rounded-card border transition-all cursor-pointer ${
                includeBeardCare
                  ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-display font-bold text-fg text-body">Моделювання бороди</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${includeBeardCare ? 'bg-accent text-accent-fg' : 'border border-line'}`}>
                  {includeBeardCare ? '✓' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between w-full text-caption text-fg-secondary">
                <span>30 хв</span>
                <span className="font-semibold text-fg">350 ₴</span>
              </div>
            </button>

            <button
              onClick={() => setIncludeShampoo(!includeShampoo)}
              type="button"
              className={`flex flex-col text-left p-4 rounded-card border transition-all cursor-pointer ${
                includeShampoo
                  ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-display font-bold text-fg text-body">СПА-миття та масаж голови</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${includeShampoo ? 'bg-accent text-accent-fg' : 'border border-line'}`}>
                  {includeShampoo ? '✓' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between w-full text-caption text-fg-secondary">
                <span>15 хв</span>
                <span className="font-semibold text-fg">150 ₴</span>
              </div>
            </button>
          </div>
        </div>

        {/* Summary card */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-card border border-line bg-surface p-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-h4 font-bold text-fg border-b border-line pb-3 flex items-center justify-between">
              <span>Підсумок пакета</span>
              <span className="text-caption font-normal text-fg-secondary">
                {totalDuration} хв загалом
              </span>
            </h3>

            {selectedServices.length === 0 && !includeBeardCare && !includeShampoo ? (
              <div className="py-8 text-center text-fg-secondary text-body">
                Будь ласка, оберіть послуги ліворуч, щоб сформувати комплексний візит.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
                {selectedServices.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-body">
                    <span className="text-fg truncate pr-2">{s.name}</span>
                    <span className="font-semibold text-fg shrink-0">{s.price} ₴</span>
                  </div>
                ))}
                {includeBeardCare && (
                  <div className="flex items-center justify-between text-body">
                    <span className="text-fg">Моделювання бороди</span>
                    <span className="font-semibold text-fg shrink-0">350 ₴</span>
                  </div>
                )}
                {includeShampoo && (
                  <div className="flex items-center justify-between text-body">
                    <span className="text-fg">СПА-миття та масаж голови</span>
                    <span className="font-semibold text-fg shrink-0">150 ₴</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-line mt-4">
            {hasBundle && (
              <div className="flex items-center justify-between text-caption text-semantic-success font-semibold bg-semantic-success/10 px-3 py-2 rounded-input border border-semantic-success/20">
                <span>Знижка комбо-пакету (-12%)</span>
                <span>-{discount} ₴</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-body font-display text-fg-secondary">До сплати:</span>
              <div className="text-right">
                {hasBundle && (
                  <div className="text-caption text-fg-secondary line-through">{baseTotal} ₴</div>
                )}
                <div className="text-2xl font-bold font-display text-fg">{finalTotal} ₴</div>
              </div>
            </div>

            <Link
              href="/booking"
              className={`inline-flex h-12 items-center justify-center rounded-input bg-accent px-6 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md text-center ${
                selectedServices.length === 0 && !includeBeardCare && !includeShampoo ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              Записатися за 60 секунд &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
