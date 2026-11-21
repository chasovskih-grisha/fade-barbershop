'use client';

import { useState } from 'react';
import type { Service } from '@/lib/api/catalog';
import {
  calculateSetTotals,
  recommendServices,
  type HairType,
  type Urgency,
} from './style-advisor-calculations';
import { StyleAdvisorControls } from './StyleAdvisorControls';
import { StyleAdvisorSummary } from './StyleAdvisorSummary';

interface ServicesStyleAdvisorProps {
  services: Service[];
}

export function ServicesStyleAdvisor({ services }: ServicesStyleAdvisorProps) {
  const [hairType, setHairType] = useState<HairType>('fade');
  const [urgency, setUrgency] = useState<Urgency>('standard');
  const [includeBeard, setIncludeBeard] = useState<boolean>(true);

  const recommendedServices = recommendServices(services);
  const { totalPrice, totalDuration } = calculateSetTotals(
    recommendedServices,
    includeBeard,
    hairType
  );

  return (
    <section className="my-8 rounded-[var(--radius-card)] bg-surface-sunken border border-accent-blue/30 p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-3 relative z-10 mb-8">
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-3.5 py-1.5 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit">
          ✨ Інтерактивний підбір образів та комбо-пакетів FADE
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-fg">
          Знайдіть свій ідеальний стиль за 30 секунд
        </h2>
        <p className="text-body text-fg-secondary max-w-2xl">
          Оберіть параметри вашого догляду — наш інтерактивний конструктор сформує персональний сет
          послуг та розрахує тривалість і фіксовану вартість.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <StyleAdvisorControls
          hairType={hairType}
          urgency={urgency}
          includeBeard={includeBeard}
          onHairType={setHairType}
          onUrgency={setUrgency}
          onIncludeBeard={setIncludeBeard}
        />
        <StyleAdvisorSummary
          hairType={hairType}
          includeBeard={includeBeard}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
        />
      </div>
    </section>
  );
}
