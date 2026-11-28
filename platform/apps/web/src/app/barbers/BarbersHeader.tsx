import type { ReactNode } from 'react';
import type { BarberFilter } from './barbers-filter';
import { BarberSearch } from './BarberSearch';

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
  studioCount?: number;
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
  studioCount = 1,
}: BarbersHeaderProps) {
  // T-4852a: довідник більше не одна студія, тож і підпис не каже «у студії»,
  // коли студій кілька.
  const where = studioCount > 1 ? 'у мережі' : 'у студії';
  return (
    <header className="flex flex-col gap-6 border-b border-line pb-12 rounded-card p-8 md:p-14">
      <div className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-caption font-semibold uppercase text-fg-muted w-fit">
        Топ-майстри та експерти бренду Fade
      </div>
      <h1 className="font-display text-display font-bold text-fg leading-none">
        Архітектори вашого стилю
      </h1>
      {/* T-4854: замість «багаторічного досвіду» й трьох вигаданих цифр — те, що
          сторінка знає напевно: скільки майстрів зараз у списку. */}
      <p className="text-bodyLg text-fg-secondary max-w-3xl">
        Майстри, які зараз працюють {where}: {barberCount}. Оберіть того, хто вам ближчий.
      </p>

      {/* T-4870a: фокус іде ланцюжком, полем пошуку, чипами й аж потім
          картками — тож поле стоїть перед чипами і в розмітці, і на екрані. */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 pt-2">
        <BarberSearch value={searchQuery} onChange={onSearchChange} />
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
      </div>
    </header>
  );
}
