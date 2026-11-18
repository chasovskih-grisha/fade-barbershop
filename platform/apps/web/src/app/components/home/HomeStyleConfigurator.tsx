'use client';

import React, { useState } from 'react';
import { Card, Button } from '@fade/ui';

interface StyleItem {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  badge?: string;
  benefits: string[];
}

const STYLES: StyleItem[] = [
  {
    id: 'fade-classic',
    name: 'Преміальний Традиційний Fade + Beard Sculpt',
    description: 'Бездоганна геометрія переходу під ваш череп, моделювання бороди гарячим рушником та преміальна косметика.',
    duration: '60 хв',
    price: '950 ₴',
    badge: 'Топ вибір гостів',
    benefits: ['Консультація стиліста', 'Миття голови до та після', 'Укладання преміум-стайлінгом']
  },
  {
    id: 'executive-cut',
    name: 'Executive Gentleman Cut',
    description: 'Класична стрижка з ретельною текстурою ножицями, миття голови автентичним релакс-масажем та фінішний стайлінг.',
    duration: '45 хв',
    price: '750 ₴',
    benefits: ['Індивідуальний підбір форми', 'Скронева корекція бритвою', 'Ароматерапевтичний компрес']
  },
  {
    id: 'royal-shave',
    name: 'Royal Hot Towel Shave & Spa',
    description: 'Королівське гоління небезпечною бритвою з трьома гарячими та холодними компресами, олійкою та бальзамом.',
    duration: '45 хв',
    price: '650 ₴',
    badge: 'Релакс & Догляд',
    benefits: ['Підготовка шкіри олійкою', 'Миттєве заспокоєння', 'Ексклюзивний парфумований післяголив']
  }
];

export function HomeStyleConfigurator() {
  const [selectedStyle, setSelectedStyle] = useState<StyleItem>(STYLES[0] as StyleItem);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  return (
    <section className="py-20 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium uppercase tracking-widest mb-4">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
            Інтерактивний Конфігуратор Образу
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            Оберіть свій рівень досконалості у <span className="text-amber-400">FADE</span>
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg">
            Кожна послуга в нашому приватному просторі — це поєднання бездоганної техніки, преміальної косметики та повної уваги до ваших деталей.
          </p>
        </div>

        {/* Style Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {STYLES.map((style) => {
            const isSelected = selectedStyle.id === style.id;
            return (
              <div
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                onMouseEnter={() => setIsHovered(style.id)}
                onMouseLeave={() => setIsHovered(null)}
                className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 border relative ${
                  isSelected
                    ? 'bg-neutral-900/90 border-amber-500/50 shadow-2xl shadow-amber-500/10 scale-[1.02]'
                    : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                {style.badge && (
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {style.badge}
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-300'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {style.duration}
                    </span>
                    <span className="text-lg font-bold text-amber-400">{style.price}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{style.name}</h3>
                <p className="text-neutral-400 text-sm line-clamp-2">{style.description}</p>
              </div>
            );
          })}
        </div>

        {/* Selected Style Deep-Dive Card */}
        <div className="bg-neutral-900/80 border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md">
                Деталі обраного сервісу
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">{selectedStyle.name}</h3>
              <p className="text-neutral-300 text-base leading-relaxed">{selectedStyle.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {selectedStyle.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-neutral-950/50 p-3 rounded-xl border border-neutral-800">
                    <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    <span className="text-sm text-neutral-200 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center bg-neutral-950/60 p-6 sm:p-8 rounded-2xl border border-neutral-800/80 space-y-6">
              <div className="text-center lg:text-right">
                <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">Вартість процедури</span>
                <span className="text-4xl font-extrabold text-amber-400">{selectedStyle.price}</span>
                <span className="text-xs text-neutral-400 block mt-1">Тривалість: {selectedStyle.duration} • Без прихованих плат</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <a
                  href="/booking"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-base"
                >
                  Записатися на стрижку
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
