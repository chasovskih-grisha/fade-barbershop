'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Service } from '@/lib/api/catalog';

interface ServicesStyleAdvisorProps {
  services: Service[];
}

export function ServicesStyleAdvisor({ services }: ServicesStyleAdvisorProps) {
  const [hairType, setHairType] = useState<'classic' | 'fade' | 'long' | 'beard'>('fade');
  const [urgency, setUrgency] = useState<'express' | 'standard' | 'luxury'>('standard');
  const [includeBeard, setIncludeBeard] = useState<boolean>(true);

  // Simple recommendation heuristic based on state
  const recommendedServices = services.filter((s) => {
    const nameLower = s.name.toLowerCase();
    if (hairType === 'beard' || includeBeard) {
      if (nameLower.includes('бород') || nameLower.includes('король') || nameLower.includes('комплекс')) return true;
    }
    if (hairType === 'fade' && (nameLower.includes('fade') || nameLower.includes('стрижк'))) return true;
    if (hairType === 'classic' && (nameLower.includes('класик') || nameLower.includes('стрижк'))) return true;
    return true;
  }).slice(0, 3);

  const totalPrice = recommendedServices.reduce((acc, s) => acc + s.price, (includeBeard && hairType !== 'beard' ? 450 : 0));
  const totalDuration = recommendedServices.reduce((acc, s) => acc + (s.duration || 45), 15);

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
          Оберіть параметри вашого догляду — наш інтерактивний конструктор сформує персональний сет послуг та розрахує тривалість і фіксовану вартість.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6 bg-surface p-6 rounded-card border border-line shadow-inner">
          {/* Step 1: Hair & Style Preference */}
          <div className="flex flex-col gap-3">
            <span className="font-semibold text-body text-fg">Бажаний стиль стрижки:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'fade', label: 'Fade / Crop', desc: 'Сучасні текстури' },
                { id: 'classic', label: 'Класика', desc: 'Діловий стиль' },
                { id: 'long', label: 'Подовжена', desc: 'Свобода форми' },
                { id: 'beard', label: 'Тільки борода', desc: 'Догляд & форма' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setHairType(item.id as any)}
                  className={`flex flex-col items-start p-3 rounded-input border transition-all text-left ${
                    hairType === item.id
                      ? 'border-accent bg-accent/10 text-fg shadow-sm'
                      : 'border-line bg-surface-sunken text-fg-secondary hover:border-fg-secondary'
                  }`}
                >
                  <span className="font-semibold text-body">{item.label}</span>
                  <span className="text-caption text-fg-secondary/80">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Include Beard */}
          {hairType !== 'beard' && (
            <div className="flex items-center justify-between p-4 rounded-input border border-line bg-surface-sunken">
              <div className="flex flex-col">
                <span className="font-semibold text-body text-fg">Додати моделювання бороди та вусів</span>
                <span className="text-caption text-fg-secondary">Фірмовий догляд з небезпечною бритвою та олією</span>
              </div>
              <button
                onClick={() => setIncludeBeard(!includeBeard)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeBeard ? 'bg-accent' : 'bg-surface-sunken border-line-strong'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-fg shadow ring-0 transition duration-200 ease-in-out ${
                    includeBeard ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Step 3: Pacing / Urgency */}
          <div className="flex flex-col gap-3">
            <span className="font-semibold text-body text-fg">Бажаний темп візиту:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'express', label: '⚡ Експрес', time: '~40 хв' },
                { id: 'standard', label: '☕ Стандарт', time: '~60 хв' },
                { id: 'luxury', label: '👑 Королівський', time: '~90 хв' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setUrgency(p.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-input border transition-all text-center ${
                    urgency === p.id
                      ? 'border-accent-blue bg-accent-blue/15 text-fg shadow-sm'
                      : 'border-line bg-surface-sunken text-fg-secondary hover:border-fg-secondary'
                  }`}
                >
                  <span className="font-semibold text-body">{p.label}</span>
                  <span className="text-caption text-fg-secondary">{p.time}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary & CTA Card */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-sunken p-6 rounded-card border-2 border-accent-blue/40 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-semibold text-body text-fg">Ваш персональний сет:</span>
              <span className="text-caption font-semibold uppercase tracking-wider text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-pill">
                Економія часу -20%
              </span>
            </div>

            <ul className="flex flex-col gap-2.5">
              {hairType !== 'beard' && (
                <li className="flex items-center justify-between text-body">
                  <span className="text-fg-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Чоловіча стрижка ({hairType === 'fade' ? 'Fade Atelier' : 'Класика'})
                  </span>
                  <span className="font-semibold text-fg">650 ₴</span>
                </li>
              )}
              {includeBeard && (
                <li className="flex items-center justify-between text-body">
                  <span className="text-fg-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Моделювання бороди та догляд
                  </span>
                  <span className="font-semibold text-fg">450 ₴</span>
                </li>
              )}
              <li className="flex items-center justify-between text-body">
                <span className="text-fg-secondary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                  Фірмовий ритуал гарячого рушника & стайлінг
                </span>
                <span className="text-accent-blue font-medium text-caption">Включено</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-line mt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-caption text-fg-secondary">Загальна вартість</span>
                <span className="font-display text-2xl font-bold text-fg">{totalPrice} ₴</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-caption text-fg-secondary">Тривалість</span>
                <span className="font-semibold text-body text-fg">{totalDuration} хв</span>
              </div>
            </div>

            <Link
              href="/booking"
              className="inline-flex h-12 w-full items-center justify-center rounded-input bg-accent px-6 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-lg hover:scale-[1.01]"
            >
              Записатися за цим сетом &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
