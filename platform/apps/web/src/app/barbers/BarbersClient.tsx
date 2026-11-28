'use client';

import { useState } from 'react';
import { BarberCard } from './BarberCard';
import { BarbersMasterclassVIPShowcase } from './BarbersMasterclassVIPShowcase';
import { BarbersHeader } from './BarbersHeader';
import { BarbersEmptyState } from './BarbersEmptyState';
import { BarberBreadcrumb } from './BarberBreadcrumb';
import { filterBarbers, type BarberFilter } from './barbers-filter';
import type { StudioRoster } from '@/lib/api/studio-directory';

// T-4852a: довідник — це мережа, а не перша студія. Кожна студія з людьми має
// свій заголовок; людина з двома призначеннями показується один раз і називає
// обидві студії. Порожня (або відфільтрована) студія заголовка не отримує.

interface BarbersClientProps {
  studios: StudioRoster[];
}

export function BarbersClient({ studios }: BarbersClientProps) {
  const [activeFilter, setActiveFilter] = useState<BarberFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const everyone = studios.flatMap((studio) => studio.barbers);
  const groups = studios
    .map((studio) => ({
      ...studio,
      barbers: filterBarbers(studio.barbers, activeFilter, searchQuery),
    }))
    .filter((studio) => studio.barbers.length > 0);

  const resetFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <BarberBreadcrumb />
      <BarbersHeader
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        barberCount={everyone.length}
        studioCount={studios.length}
      />

      {groups.length === 0 ? (
        <BarbersEmptyState onReset={resetFilters} />
      ) : (
        groups.map((studio) => (
          <section
            key={studio.code}
            aria-labelledby={`studio-${studio.code}`}
            className="flex flex-col gap-8"
          >
            <h2 id={`studio-${studio.code}`} className="font-display text-h3 font-bold text-fg">
              {studio.name}
              {studio.city ? (
                <span className="ml-3 text-body font-normal text-fg-secondary">{studio.city}</span>
              ) : null}
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {studio.barbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  id={barber.id}
                  slug={barber.slug}
                  name={barber.name}
                  role={barber.role ?? undefined}
                  photoUrl={barber.photoUrl}
                  specialties={barber.specialties ?? undefined}
                  experience={barber.experience ?? undefined}
                  portfolioThumbUrl={barber.portfolioThumbUrl ?? undefined}
                  studios={barber.studios?.map((studio) => studio.name)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <BarbersMasterclassVIPShowcase />
    </div>
  );
}
