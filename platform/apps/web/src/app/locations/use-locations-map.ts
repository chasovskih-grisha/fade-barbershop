'use client';

import { useEffect, useRef } from 'react';
import type { Location } from '@/lib/api/locations';

// T-4826: піни на карті `/locations` будуються з тих самих `lat`/`lng`, що є в
// записі. Leaflet тягнеться динамічно (він чіпає window), тайли — OpenStreetMap
// без ключа й без акаунта, тож новий геокодер не потрібен.

export const MAP_TILE_FILTER = [
  '.locations-map .leaflet-tile-pane{filter:invert(0.92) hue-rotate(180deg) saturate(0.7)}',
  '.locations-map .leaflet-container{background:transparent}',
].join('');

export interface LocationsMapOptions {
  selectedCode: string | null;
  onSelect: (code: string) => void;
  onFail: () => void;
}

export function useLocationsMap(locations: Location[], options: LocationsMapOptions) {
  const { selectedCode, onSelect, onFail } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const pinsRef = useRef(new Map<string, import('leaflet').CircleMarker>());
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    const pins = pinsRef.current;
    void import('leaflet')
      .then(({ default: L }) => {
        if (cancelled || !containerRef.current) return;
        const first = locations[0];
        const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
          [first?.lat ?? 50.45, first?.lng ?? 30.52],
          12
        );
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        const bounds: [number, number][] = [];
        for (const location of locations) {
          const pin = L.circleMarker([location.lat, location.lng], { radius: 9, weight: 2 })
            .addTo(map)
            .on('click', () => selectRef.current(location.code));
          pins.set(location.code, pin);
          bounds.push([location.lat, location.lng]);
        }
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32] });
        mapRef.current = map;
      })
      .catch(() => {
        if (!cancelled) onFail();
      });

    return () => {
      cancelled = true;
      const map = mapRef.current;
      map?.remove();
      mapRef.current = null;
      pins.clear();
    };
  }, [locations, onFail]);

  useEffect(() => {
    const pin = selectedCode ? pinsRef.current.get(selectedCode) : undefined;
    const map = mapRef.current;
    if (!pin || !map) return;
    map.setView(pin.getLatLng(), Math.max(map.getZoom(), 14));
  }, [selectedCode]);

  return containerRef;
}
