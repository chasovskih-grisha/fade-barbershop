'use client';

import React, { useState } from 'react';
import { STYLES, type StyleItem } from './style-configurator-data';
import { StyleDetailsCard } from './StyleDetailsCard';
import { ClockIcon, SparkleIcon } from './style-configurator-icons';

export function HomeStyleConfigurator() {
  const [selectedStyle, setSelectedStyle] = useState<StyleItem>(STYLES[0] as StyleItem);

  return (
    <section className="py-20 bg-gradient-to-b from-surface-sunken via-surface to-surface-sunken relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-semantic-warning/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/20 text-xs font-medium uppercase tracking-wider mb-4">
            <SparkleIcon />
            Інтерактивний Конфігуратор Образу
          </div>
          <h2 className="text-h3 sm:text-display font-bold text-fg mb-6">
            Оберіть свій рівень досконалості у <span className="text-semantic-warning">FADE</span>
          </h2>
          <p className="text-fg-secondary text-body sm:text-bodyLg">
            Кожна послуга в нашому приватному просторі — це поєднання бездоганної техніки,
            преміальної косметики та повної уваги до ваших деталей.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {STYLES.map((style) => {
            const isSelected = selectedStyle.id === style.id;
            return (
              <button
                type="button"
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`relative cursor-pointer rounded-card p-6 transition-all duration-300 border text-left ${
                  isSelected
                    ? 'bg-surface border-semantic-warning shadow-2xl scale-[1.02]'
                    : 'bg-surface/50 border-line hover:border-line-strong hover:bg-surface/80'
                }`}
              >
                {style.badge && (
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-semantic-warning/20 text-semantic-warning border border-semantic-warning/30">
                    {style.badge}
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-card flex items-center justify-center ${isSelected ? 'bg-semantic-warning text-accent-fg font-bold' : 'bg-surface-raised text-fg-secondary'}`}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <line x1="20" y1="4" x2="8.12" y2="15.88" />
                      <line x1="14.47" y1="14.48" x2="20" y2="20" />
                      <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs text-fg-secondary flex items-center gap-1.5">
                      <ClockIcon />
                      {style.duration}
                    </span>
                    <span className="text-h4 font-bold text-semantic-warning">{style.price}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-fg mb-2">{style.name}</h3>
                <p className="text-fg-secondary text-sm line-clamp-2">{style.description}</p>
              </button>
            );
          })}
        </div>

        <StyleDetailsCard style={selectedStyle} />
      </div>
    </section>
  );
}
