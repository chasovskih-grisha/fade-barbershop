'use client';

// Пікер точки локації (T-4405, admin-screens §1.2): клік/перетягування маркера
// ставить координати, пошук адреси веде до точки, reverse geocode заповнює
// структуровані поля. Leaflet + OSM без ключів (ADR 0022).
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Button, TextField } from '@fade/ui';
import {
  reverseAddress,
  searchAddress,
  type AddressPartsValue,
  type GeocodeSuggestion,
} from './location-geocode-client';
import { useLeafletMap } from './use-leaflet-map';

export default function LocationMapPicker({
  lat,
  lng,
  onChange,
  onAddressParts,
  disabled = false,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  onAddressParts: (parts: AddressPartsValue) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  const fillFromPoint = (pointLat: number, pointLng: number) => {
    onChange(pointLat, pointLng);
    void reverseAddress(pointLat, pointLng).then((parts) => parts && onAddressParts(parts));
  };
  const containerRef = useLeafletMap(lat, lng, (point) => fillFromPoint(point.lat, point.lng));

  const runSearch = async () => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchAddress(query));
    } finally {
      setSearching(false);
    }
  };

  const choose = (suggestion: GeocodeSuggestion) => {
    onChange(suggestion.lat, suggestion.lng);
    onAddressParts(suggestion.addressParts);
    setResults([]);
  };

  return (
    <section aria-label="Точка на карті" className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <TextField
          label="Пошук адреси"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void runSearch();
            }
          }}
          placeholder="Вулиця, будинок, місто"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void runSearch()}
          disabled={disabled || searching}
        >
          {searching ? 'Пошук…' : 'Знайти'}
        </Button>
      </div>
      {results.length > 0 && (
        <ul aria-label="Результати пошуку адреси" className="flex flex-col gap-1">
          {results.map((suggestion) => (
            <li key={`${suggestion.lat},${suggestion.lng}`}>
              <Button type="button" variant="secondary" onClick={() => choose(suggestion)}>
                {suggestion.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        data-testid="location-map"
        aria-label="Карта локації"
        className="h-64 w-full rounded-card border border-line"
      />
      <p className="text-caption text-fg-muted">
        Клік по карті або перетягування маркера ставить точку: {lat.toFixed(6)}, {lng.toFixed(6)}
      </p>
    </section>
  );
}
