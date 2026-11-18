'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function BarbersMasterclassVIPShowcase() {
  const [selectedMasterclass, setSelectedMasterclass] = useState<number | null>(1);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  const masterclasses = [
    {
      id: 1,
      title: 'Master Fade & Skin-Fade Geometry',
      instructor: 'Олександр "FadeMaster" К.',
      level: 'Просунутий / Для майстрів та ентузіастів',
      duration: '3 години (Індивідуальний практичний сеанс)',
      price: '3,800 ₴',
      description:
        'Поглиблений майстер-клас з ідеальної градуйованої розтушовки “під нуль”, роботи з різними типами черепа та текстурування макушки.',
      highlights: [
        'Аналіз пропорцій та геометрії обличчя',
        'Техніки роботи безпечною бритвою та шейвером',
        'Секрети довговічності та чистоти переходу',
      ],
    },
    {
      id: 2,
      title: 'Sculpting Beard & Hot Towel Ritual',
      instructor: 'Максим "BeardCraft" В.',
      level: 'Базовий та середній',
      duration: '2.5 години',
      price: '3,200 ₴',
      description:
        'Мистецтво моделювання бороди за золотим перетином, техніки гарячого рушника та правильного догляду за преміум-косметикою Fade.',
      highlights: [
        'Моделювання симетрії бороди та вусів',
        'Королівське гоління з гарячим компресом',
        'Добірка індивідуального домашнього догляду',
      ],
    },
    {
      id: 3,
      title: 'Executive VIP Styling & Grooming',
      instructor: 'Дмитро "Executive" С.',
      level: 'VIP / Персональний імідж-консалтинг',
      duration: '4 години (Повний день трансформації)',
      price: '6,500 ₴',
      description:
        'Ексклюзивний сеанс для бізнес-лідерів та публічних персон. Підбір зачіски та бороди під гардероб і статусний стиль.',
      highlights: [
        'Повний комплекс преміум-стрижки та догляду',
        'Консультація стиліста щодо іміджу та гардеробу',
        'VIP-карта Fade на 15% знижки на весь рік',
      ],
    },
  ];

  const currentClass = masterclasses.find((m) => m.id === selectedMasterclass) ?? masterclasses[0]!;

  const handleBooking = () => {
    setBookedSuccess(true);
    setTimeout(() => setBookedSuccess(false), 4000);
  };

  return (
    <section className="mt-16 rounded-card bg-surface-sunken border border-line p-8 md:p-12">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-1.5 text-caption font-semibold uppercase text-fg-muted w-fit mx-auto md:mx-0">
            ✨ Ексклюзивні майстер-класи та VIP-програми від топ-барберів
          </div>
          <h2 className="font-display text-h2 font-bold text-fg leading-tight">
            Освоюйте майстерність або замовляйте VIP-трансформацію
          </h2>
          <p className="text-bodyLg text-fg-secondary max-w-3xl">
            Наші провідні майстри діляться професійними секретами на авторських майстер-класах або
            надають персональний VIP-консалтинг для найвибагливіших клієнтів.
          </p>
        </div>

        {/* Masterclass Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {masterclasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedMasterclass(cls.id);
                setBookedSuccess(false);
              }}
              className={`p-6 rounded-card text-left transition-all flex flex-col justify-between gap-4 border cursor-pointer ${
                selectedMasterclass === cls.id
                  ? 'bg-surface border-accent shadow-xl ring-2 ring-accent/30 scale-[1.02]'
                  : 'bg-surface/50 border-line hover:border-line-strong hover:bg-surface/80'
              }`}
            >
              <div className="flex flex-col gap-2">
                <span className="text-caption font-semibold text-accent-gold uppercase">
                  {cls.level}
                </span>
                <h3 className="font-display text-h4 font-bold text-fg">{cls.title}</h3>
                <p className="text-caption text-fg-secondary">{cls.instructor}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-line">
                <span className="text-caption text-fg-secondary">{cls.duration}</span>
                <span className="text-body font-bold text-fg">{cls.price}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Masterclass Detail Card */}
        <div className="p-8 rounded-card bg-surface border border-line-strong/80 shadow-xl flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="flex flex-col gap-5 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-pill bg-accent/10 text-accent text-caption font-semibold">
                {currentClass.level}
              </span>
              <span className="px-3 py-1 rounded-pill bg-surface-sunken text-fg-secondary text-caption font-medium">
                ⏱ {currentClass.duration}
              </span>
              <span className="px-3 py-1 rounded-pill bg-accent-gold/15 text-accent-gold text-caption font-semibold">
                💳 {currentClass.price}
              </span>
            </div>

            <h3 className="font-display text-h3 font-bold text-fg">{currentClass.title}</h3>

            <p className="text-body text-fg-secondary">{currentClass.description}</p>

            <div className="flex flex-col gap-2 pt-2">
              <span className="text-caption font-semibold uppercase text-fg">
                Що входить до програми:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {currentClass.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2.5 text-caption text-fg-secondary"
                  >
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-80 p-6 rounded-card bg-surface-sunken border border-line justify-between shrink-0">
            <div className="flex flex-col gap-2">
              <span className="text-caption text-fg-secondary">Провідний експерт:</span>
              <span className="text-body font-bold text-fg">{currentClass.instructor}</span>
              <div className="h-px bg-line my-2" />
              <span className="text-caption text-fg-secondary">Формат:</span>
              <span className="text-caption font-semibold text-fg">
                Індивідуальна сесія або міні-група
              </span>
            </div>

            {bookedSuccess ? (
              <div className="p-4 rounded-card bg-accent-green/15 border border-accent-green/30 text-accent-green text-center text-caption font-semibold">
                🎉 Заявку на бронь прийнято! Наш адміністратор зв'яжеться з вами протягом 15 хвилин.
              </div>
            ) : (
              <button
                onClick={handleBooking}
                className="w-full py-3.5 px-6 rounded-pill bg-accent text-accent-fg font-semibold hover:opacity-95 transition-all shadow-md text-center cursor-pointer"
              >
                Забронювати участь
              </button>
            )}

            <Link
              href="/booking"
              className="text-center text-caption text-fg-secondary hover:text-fg transition-colors"
            >
              Або перейдіть до звичайного запису &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
