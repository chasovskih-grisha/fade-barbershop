'use client';

import { useState } from 'react';
import { BarberCard } from './BarberCard';
import { BarbersMasterclassVIPShowcase } from './BarbersMasterclassVIPShowcase';
import { BarbersHeader } from './BarbersHeader';
import { BarbersEmptyState } from './BarbersEmptyState';
import { filterBarbers, type Barber, type BarberFilter } from './barbers-filter';

interface BarbersClientProps {
  barbers: Barber[];
}

export function BarbersClient({ barbers }: BarbersClientProps) {
  const [activeFilter, setActiveFilter] = useState<BarberFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBarbers = filterBarbers(barbers, activeFilter, searchQuery);

  const resetFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <BarbersHeader
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        barberCount={barbers.length}
      />

      {filteredBarbers.length === 0 ? (
        <BarbersEmptyState onReset={resetFilters} />
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

      <BarbersMasterclassVIPShowcase />
    </div>
  );
}
