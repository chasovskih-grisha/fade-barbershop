import type { ReactNode } from 'react';
import Link from 'next/link';
import type { BarberFilter } from './barbers-filter';
import { BarbersHighlights } from './BarbersHighlights';

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function FilterPill({ active, onClick, children }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-pill px-4 py-2 text-caption font-semibold transition-all cursor-pointer ${
        active
          ? 'bg-accent text-accent-fg'
          : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

interface BarbersHeaderProps {
  activeFilter: BarberFilter;
  onFilterChange: (filter: BarberFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  barberCount: number;
}

const FILTERS: Array<{ value: BarberFilter; label: string }> = [
  { value: 'all', label: 'Усі майстри' },
  { value: 'top', label: '⭐ Топ-барбери' },
  { value: 'beard', label: '🧔 Експерти бороди' },
  { value: 'fade', label: '⚡ Фейд-спеціалісти' },
];

export function BarbersHeader({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  barberCount,
}: BarbersHeaderProps) {
  return (
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

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-2.5">
          {FILTERS.map(({ value, label }) => (
            <FilterPill
              key={value}
              active={activeFilter === value}
              onClick={() => onFilterChange(value)}
            >
              {value === 'all' ? `${label} (${barberCount})` : label}
            </FilterPill>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Пошук за ім'ям або послугою..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-pill bg-surface-sunken border border-line px-5 py-2.5 text-caption text-fg placeholder:text-fg-secondary/60 focus:outline-none focus:border-accent shadow-inner transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-secondary hover:text-fg text-caption cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <BarbersHighlights />
    </header>
  );
}
