'use client';

// Фільтр-бар списку клієнтів (T-4606a, admin-screens §6.1): пошук із debounce
// (стан живе в хуку), локація, статус лояльності і «Скинути фільтри». Окремий
// компонент — сторінка лишається читабельною і тримає власну складність низько.
import { Button } from '@fade/ui';
import { FilterSelect } from '../components/FilterSelect';
import type { useClientsList } from './useClientsList';

const LOYALTY_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'inactive', label: 'Неактивні' },
];

const INPUT_CLASS =
  'w-full max-w-xs rounded-input border border-line bg-surface-base px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

export function ClientsFilters({ list }: { list: ReturnType<typeof useClientsList> }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <input
        type="search"
        aria-label="Пошук клієнтів за ім’ям або телефоном"
        placeholder="Пошук за ім’ям або телефоном..."
        value={list.input}
        onChange={(event) => list.setInput(event.target.value)}
        className={INPUT_CLASS}
      />
      <FilterSelect
        label="Локація"
        value={list.locationId}
        options={[
          { value: '', label: 'Усі' },
          ...list.locations.map((location) => ({ value: location.id, label: location.name })),
        ]}
        onChange={(value) => list.patch({ locationId: value, page: '' })}
      />
      <FilterSelect
        label="Статус лояльності"
        value={list.loyaltyStatus || 'all'}
        options={LOYALTY_OPTIONS}
        onChange={(value) => list.patch({ loyaltyStatus: value === 'all' ? '' : value, page: '' })}
      />
      {list.hasFilters && (
        <Button variant="ghost" size="md" onClick={list.reset}>
          Скинути фільтри
        </Button>
      )}
    </div>
  );
}
