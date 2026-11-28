'use client';

import { useCallback, useState } from 'react';
import type { Location } from '@/lib/api/locations';
import { MAP_TILE_FILTER, useLocationsMap } from './use-locations-map';

// T-4826: карта стоїть поруч зі списком на широкому екрані й під картками на
// вузькому. Піни — з координат запису. Якщо Leaflet не завантажився, список
// лишається повним: на місці полотна видно лише це речення.

export function LocationsMap({
  locations,
  selectedCode,
  onSelect,
}: {
  locations: Location[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  const containerRef = useLocationsMap(locations, { selectedCode, onSelect, onFail: fail });

  return (
    <section
      id="locations-map"
      aria-label="Студії на карті"
      className="locations-map relative h-72 w-full overflow-hidden rounded-card border border-line bg-surface-sunken lg:h-[32rem]"
    >
      <style>{MAP_TILE_FILTER}</style>
      <div ref={containerRef} className="h-full w-full" data-testid="locations-map-canvas" />
      {failed && (
        <p
          data-testid="locations-map-fallback"
          className="absolute inset-0 flex items-center justify-center p-6 text-center text-body text-fg-secondary"
        >
          Карта не завантажилась — усі студії є в списку нижче.
        </p>
      )}
    </section>
  );
}
