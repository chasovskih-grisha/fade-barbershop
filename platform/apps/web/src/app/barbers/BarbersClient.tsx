'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarberCard } from './BarberCard';
import { BarbersMasterclassVIPShowcase } from './BarbersMasterclassVIPShowcase';

interface Barber {
  id: string;
  slug: string;
  name: string;
  role?: string | null;
  photoUrl?: string | null;
  specialties?: string[] | null;
  experience?: string | null;
}

interface BarbersClientProps {
  barbers: Barber[];
  siteUrl: string;
}

export function BarbersClient({ barbers, siteUrl }: BarbersClientProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'top' | 'beard' | 'fade'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBarbers = barbers.filter((barber) => {
    const matchesSearch =
      barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (barber.role && barber.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (barber.specialties &&
        barber.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (activeFilter === 'top') {
      return (
        (barber.role &&
          (barber.role.toLowerCase().includes('топ') ||
            barber.role.toLowerCase().includes('старший'))) ||
        (barber.experience && parseInt(barber.experience, 10) >= 5)
      );
    }
    if (activeFilter === 'beard') {
      return barber.specialties?.some(
        (s) => s.toLowerCase().includes('бород') || s.toLowerCase().includes('beard')
      );
    }
    if (activeFilter === 'fade') {
      return barber.specialties?.some(
        (s) =>
          s.toLowerCase().includes('fade') ||
          s.toLowerCase().includes('фейд') ||
          s.toLowerCase().includes('класич')
      );
    }
    return true;
  });

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <header className="flex flex-col gap-6 border-b border-line pb-12 rounded-card p-8 md:p-14">
        <Link
          href="/"
          className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2"
        >
          &larr; На головну
        </Link>
        <div className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-caption font-semibold uppercase text-fg-muted w-fit">
          Топ-майстри та експерти бренду Fade
        </div>
        <h1 className="font-display text-display font-bold text-fg leading-none">
          Архітектори вашого стилю
        </h1>
        <p className="text-bodyLg text-fg-secondary max-w-3xl">
          Професіонали своєї справи з багаторічним досвідом, що пройшли суворий відбір. Жодних
          компромісів у якості, увазі до деталей та геометрії вашої стрижки.
        </p>

        {/* Інтерактивний пошук та фільтри */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`inline-flex items-center rounded-pill px-4 py-2 text-caption font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
              }`}
            >
              Усі майстри ({barbers.length})
            </button>
            <button
              onClick={() => setActiveFilter('top')}
              className={`inline-flex items-center rounded-pill px-4 py-2 text-caption font-semibold transition-all cursor-pointer ${
                activeFilter === 'top'
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
              }`}
            >
              ⭐ Топ-барбери
            </button>
            <button
              onClick={() => setActiveFilter('beard')}
              className={`inline-flex items-center rounded-pill px-4 py-2 text-caption font-semibold transition-all cursor-pointer ${
                activeFilter === 'beard'
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
              }`}
            >
              🧔 Експерти бороди
            </button>
            <button
              onClick={() => setActiveFilter('fade')}
              className={`inline-flex items-center rounded-pill px-4 py-2 text-caption font-semibold transition-all cursor-pointer ${
                activeFilter === 'fade'
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
              }`}
            >
              ⚡ Фейд-спеціалісти
            </button>
          </div>

          <div className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Пошук за ім'ям або послугою..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-pill bg-surface-sunken border border-line px-5 py-2.5 text-caption text-fg placeholder:text-fg-secondary/60 focus:outline-none focus:border-accent shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-secondary hover:text-fg text-caption cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Додатковий брендовий акцент */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-line">
          <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-1.5">
            <span className="text-h4 font-display font-bold text-fg">5+ років</span>
            <span className="text-caption text-fg-secondary font-medium">
              Середній досвід роботи у преміум-сегменті
            </span>
          </div>
          <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-1.5">
            <span className="text-h4 font-display font-bold text-fg">100%</span>
            <span className="text-caption text-fg-secondary font-medium">
              Індивідуальний підхід до форми черепа та стилю
            </span>
          </div>
          <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-1.5">
            <span className="text-h4 font-display font-bold text-fg">Прямий запис</span>
            <span className="text-caption text-fg-secondary font-medium">
              Обирайте свого улюбленого майстра в один клік
            </span>
          </div>
        </div>
      </header>

      {filteredBarbers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-[var(--radius-card)] bg-surface-sunken/50 border border-line text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl">
            🔍
          </div>
          <h3 className="text-h3 font-display font-bold text-fg">
            Майстрів за вашим запитом не знайдено
          </h3>
          <p className="text-body text-fg-secondary max-w-md">
            Спробуйте змінити критерії пошуку або обрати іншу категорію фільтрації, щоб знайти
            потрібного спеціаліста.
          </p>
          <button
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 rounded-pill bg-accent px-6 py-2.5 text-caption font-semibold text-accent-fg transition-colors hover:bg-fg-secondary cursor-pointer"
          >
            Скинути фільтри
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-2">
          {filteredBarbers.map((barber) => (
            <BarberCard
              key={barber.id}
              id={barber.id}
              slug={barber.slug}
              name={barber.name}
              role={barber.role ?? undefined}
              photoUrl={barber.photoUrl}
              specialties={barber.specialties ?? undefined}
              experience={barber.experience ?? undefined}
            />
          ))}
        </div>
      )}

      {/* Ексклюзивний розділ Masterclass / Академія та VIP послуги */}
      <BarbersMasterclassVIPShowcase />
    </div>
  );
}
