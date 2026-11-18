'use client';

import { FilterSelect } from '../components/FilterSelect';
import type { AnalyticsFiltersState, AnalyticsPeriod } from './analytics-types';

export function AnalyticsFilters({
  filters,
  locations,
  barbers,
  onChange,
}: {
  filters: AnalyticsFiltersState;
  locations: { id: string; name: string }[];
  barbers: { id: string; name: string | null }[];
  onChange: (next: AnalyticsFiltersState) => void;
}) {
  const periodOptions = [
    { value: 'day', label: 'Сьогодні' },
    { value: 'week', label: 'Цей тиждень' },
    { value: 'month', label: 'Цей місяць' },
  ];

  const locationOptions = [
    { value: 'all', label: 'Усі локації' },
    ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
  ];

  const barberOptions = [
    { value: 'all', label: 'Усі майстри' },
    ...barbers.map((b) => ({ value: b.id, label: b.name ?? `Майстер #${b.id.slice(0, 4)}` })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface p-4">
      <FilterSelect
        label="Період"
        value={filters.period}
        options={periodOptions}
        onChange={(val) => onChange({ ...filters, period: val as AnalyticsPeriod })}
      />
      <FilterSelect
        label="Локація"
        value={filters.locationId}
        options={locationOptions}
        onChange={(val) => onChange({ ...filters, locationId: val })}
      />
      <FilterSelect
        label="Майстер"
        value={filters.barberId}
        options={barberOptions}
        onChange={(val) => onChange({ ...filters, barberId: val })}
      />
    </div>
  );
}
