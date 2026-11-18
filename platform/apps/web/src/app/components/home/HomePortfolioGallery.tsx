import React from 'react';
import Link from 'next/link';

export function HomePortfolioGallery() {
  const showcaseItems = [
    {
      title: 'High Skin Fade & Texture Crop',
      barber: 'Денис',
      category: 'Стрижка & Текстура',
      imageGradient: 'from-accent-blue/20 via-surface-raised to-surface-sunken',
      tag: 'Бестселер',
      description: 'Ідеальна геометрія плавного переходу з текстурним макулатурним кропом.',
    },
    {
      title: 'Executive Beard Sculpting & Hot Towel',
      barber: 'Артем',
      category: 'Борода & Ритуал',
      imageGradient: 'from-accent/20 via-surface-raised to-surface-sunken',
      tag: 'Преміум догляд',
      description: 'Моделювання контурів бороди з ритуалом гарячого компресу та олійками.',
    },
    {
      title: 'Classic Taper Fade & Pompadour Styling',
      barber: 'Денис',
      category: 'Класика',
      imageGradient: 'from-accent-blue/15 via-surface-raised to-surface-sunken',
      tag: 'Фірмовий стиль',
      description: 'Витончений тейпер-фейд у поєднанні з класичним обʼємним стайлінгом.',
    },
    {
      title: 'Royal Hot Towel Shave & Royal Ritual',
      barber: 'Артем',
      category: 'Королівське гоління',
      imageGradient: 'from-accent/25 via-surface-raised to-surface-sunken',
      tag: 'Ексклюзив',
      description: 'Традиційне гоління небезпечною бритвою з ароматерапією та масажем обличчя.',
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-14 shadow-lg">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
              <span>✦ Портфоліо та Візуальна Галерея FADE</span>
            </div>
            <h2 className="text-h2 font-display font-bold text-fg">
              Архітектура деталей у кожному кадрі
            </h2>
            <p className="text-bodyLg text-fg-secondary">
              Перегляньте приклади наших робіт: бездоганні переходи (skin fade), чисті контури, моделювання бороди та преміальний стайлінг від топ-майстрів Fade з можливістю миттєвого бронювання слотів.
            </p>
          </div>
          <Link
            href="/barbers"
            className="inline-flex h-11 items-center justify-center rounded-input border border-line px-6 text-body font-semibold text-fg hover:bg-interactive transition-all w-fit"
          >
            Усі роботи та майстри &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcaseItems.map((item, index) => (
            <div
              key={index}
              className="group relative flex flex-col justify-between rounded-card border border-line bg-surface-raised overflow-hidden shadow-md transition-all duration-300 hover:border-accent-blue/50 hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`h-52 w-full bg-gradient-to-br ${item.imageGradient} flex items-center justify-center p-6 relative overflow-hidden border-b border-line`}>
                <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-50" />
                <div className="absolute top-3 right-3 rounded-pill bg-surface/95 border border-line px-3 py-1 text-caption font-semibold text-fg shadow-sm">
                  {item.tag}
                </div>
                <div className="text-center z-10 flex flex-col items-center gap-2">
                  <span className="w-12 h-12 rounded-full bg-surface/80 border border-line flex items-center justify-center text-accent font-display font-bold text-h4 shadow-sm group-hover:scale-110 transition-transform">
                    {index + 1}
                  </span>
                  <span className="text-body font-display font-bold text-fg drop-shadow-sm">{item.category}</span>
                </div>
              </div>

              <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-h4 font-display font-bold text-fg group-hover:text-accent-blue transition-colors">{item.title}</h3>
                  <p className="text-caption text-fg-secondary">{item.description}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-line/80 text-body-s text-fg-secondary">
                  <span>Майстер: <strong className="text-fg">{item.barber}</strong></span>
                  <Link href="/booking" className="text-accent font-semibold hover:underline">
                    Записатися &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
