'use client';

import { useState } from 'react';
import { Button, TextField } from '@fade/ui';
import type { Location } from '@/lib/api/locations';
import { LocationCityGroups } from './LocationCityGroups';

// T-4828a: пошук по вже завантажених картках `/locations`. Список короткий,
// тому фільтр на клієнті: без нового запиту й без стану в URL.

function matches(location: Location, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    location.name.toLowerCase().includes(needle) || location.address.toLowerCase().includes(needle)
  );
}

export function LocationFinder({
  locations,
  selectedCode = null,
  onSelect,
}: {
  locations: Location[];
  selectedCode?: string | null;
  onSelect?: ((code: string) => void) | undefined;
}) {
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const visible = locations.filter((location) => matches(location, query));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-full flex-col gap-2 sm:max-w-md">
        <TextField
          label="Знайти студію"
          type="search"
          value={query}
          placeholder="Назва або вулиця"
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="text-caption text-fg-muted" role="status" aria-live="polite">
          {searching
            ? `Знайдено студій: ${visible.length}`
            : `Студій у мережі: ${locations.length}`}
        </p>
      </div>

      {searching && visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-8 text-center">
          <p className="text-body text-fg-secondary">
            За запитом «{query.trim()}» студій не знайдено.
          </p>
          <Button type="button" variant="secondary" onClick={() => setQuery('')}>
            Показати всі студії
          </Button>
        </div>
      ) : (
        <LocationCityGroups locations={visible} selectedCode={selectedCode} onSelect={onSelect} />
      )}
    </div>
  );
}
