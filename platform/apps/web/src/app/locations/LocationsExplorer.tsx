'use client';

import { useCallback, useState } from 'react';
import type { Location } from '@/lib/api/locations';
import { LocationFinder } from './LocationFinder';
import { LocationsMap } from './LocationsMap';

// T-4826: вибір піна веде до картки, вибір картки веде до піна. Обидва
// напрямки — той самий `selectedCode`, тож підсвітка й центр карти не можуть
// розійтися.

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function LocationsExplorer({ locations }: { locations: Location[] }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const fromPin = useCallback((code: string) => {
    setSelectedCode(code);
    const card = document.getElementById(`studio-card-${code}`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.focus();
  }, []);

  const fromCard = useCallback((code: string) => {
    setSelectedCode(code);
    scrollTo('locations-map');
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
      <LocationFinder locations={locations} selectedCode={selectedCode} onSelect={fromCard} />
      <div className="lg:sticky lg:top-24">
        <LocationsMap locations={locations} selectedCode={selectedCode} onSelect={fromPin} />
      </div>
    </div>
  );
}
