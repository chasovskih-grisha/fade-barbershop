import React from 'react';
import { Card } from '@fade/ui';

export function HomeLoyalty() {
  const perks = [
    {
      title: 'Перший візит -100 ₴',
      description: 'Знижка на першу чоловічу стрижку або комплекс у будь-якій студії мережі.',
      icon: '✨',
    },
    {
      title: '2-Chair Privacy',
      description: 'Жодного шуму та черг. Тільки ви, майстер, гарячий рушник та якісна музика.',
      icon: '🌿',
    },
    {
      title: 'Вхід за 1 хвилину',
      description: 'Жодних складних паролів — швидкий вхід за телефоном та SMS OTP.',
      icon: '⚡',
    },
  ];

  return (
    <section className="relative overflow-hidden flex flex-col gap-8 rounded-[var(--radius-card)] bg-surface-sunken/40 p-6 md:p-10 border border-line/80 shadow-md backdrop-blur-sm">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-2 text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 mx-auto rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4 py-1 text-caption font-semibold uppercase tracking-wider text-accent-blue shadow-sm">
          ✦ Переваги FADE
        </span>
        <h2 className="text-h3 font-display font-semibold text-fg">
          Стандарти преміального догляду поруч із домом
        </h2>
        <p className="text-body text-fg-secondary">
          Ми створили простір, де цінують ваш час, комфорт та особистий простір.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {perks.map((perk, index) => (
          <Card
            key={index}
            className="p-6 flex flex-col gap-4 bg-surface/90 border border-line hover:border-accent-blue/40 hover:shadow-xl transition-all duration-300 group backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-input bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
              {perk.icon}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-h4 font-display font-semibold text-fg">{perk.title}</h3>
              <p className="text-body text-fg-secondary">{perk.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
