'use client';

// Крок 1 флоу запису (booking-flow.md): вибір локації. Геолокація (фаза 9+):
// активні локації сортуються за відстанню в межах 50 км, далі — фільтр по
// місту; без геолокації — звичний список. Відмова/помилка не блокує запис.

import { Badge, Button, Card, Skeleton } from '@fade/ui';
import Link from 'next/link';
import { useNearestLocations } from '../../hooks/useNearestLocations';
import GeoLocationBanner from '../../components/GeoLocationBanner';
import type { LocationDto } from '../types';
import { BOOKING_OPENS_SOON_TEXT } from '@/lib/booking-availability';

interface Props {
  onSelect: (loc: LocationDto) => void;
}

function formatDistance(km: number): string {
  if (km < 1) return 'менше 1 км';
  return `${Math.round(km)} км`;
}

export default function LocationStep({ onSelect }: Props) {
  const { data, loading, error, status, retryGeo, clearGeo, refresh } = useNearestLocations();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-h4">Оберіть локацію</h2>
      <GeoLocationBanner
        city={data?.city ?? null}
        sortedByDistance={data?.sortedByDistance ?? false}
        status={status}
        onRetry={retryGeo}
        onClear={clearGeo}
      />
      {renderContent(data, loading, error, onSelect, refresh)}
    </div>
  );
}

function renderContent(
  { data, loading, error }: { data?: { city?: string; sortedByDistance?: boolean }; loading: boolean; error: boolean },
  onSelect: (loc: LocationDto) => void,
  refresh: () => void,
) {
  if (loading) {
    return <div className="flex flex-col gap-2" aria-busy={true}>
      <Skeleton className="h-20" /> <Skeleton className="h-20" />
    </div>;
  }
  if (error) {
    return <div className="flex flex-col items-start gap-2">
      <p className="text-fg-secondary">Не вдалося завантажити локації.</p>
      <Button onClick={refresh}>Спробувати ще раз</Button>
    </div>;
  }
  if (!data || data.locations.length === 0) {
    return <section className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface-sunken p-6">
      <div className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-caption font-semibold uppercase text-fg-muted">
        Готуємось до відкриття
      </div>
      <h1 className="font-display text-h3 font-bold text-fg">Запис ще не відкрито</h1>
      <p className="text-body text-fg-secondary">{BOOKING_OPENS_SOON_TEXT}</p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/locations" className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-5 text-body font-medium text-accent-fg">
          Де ми відкриємось
        </Link>
        <Link href="/services" className="inline-flex h-11 items-center justify-center rounded-input border border-line px-5 text-body font-medium text-fg">
          Послуги та прайс
        </Link>
      </div>
    </section>;
  }
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {data.locations.map((loc) => (
      <Card key={loc.id} interactive={true} role="button" tabIndex={0} data-testid={`location-card-${loc.id}`} className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-text text-h4 font-semibold">{loc.name}</h3>
          {loc.distanceKm !== null && <Badge tone="info">{formatDistance(loc.distanceKm)}</Badge>}
        </div>
        <p className="mt-1 text-sm text-fg-secondary">{loc.address}</p>
      </Card>
    ))}
  </div>;
}
