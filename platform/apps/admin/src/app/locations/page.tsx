'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Skeleton } from '@fade/ui';
import PageHeader from '../components/PageHeader';
import { ListStateRegion } from '../components/ListStateRegion';
import { LocationsTable } from './LocationsTable';

interface Location {
  id: string;
  code: string;
  name: string;
  address: string;
  active?: boolean;
}

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch('/admin/locations', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load locations');
      setLocations((await res.json()) as Location[]);
    } catch {
      setError('Не вдалося завантажити локації');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  return (
    <div>
      <PageHeader
        title="Локації"
        subtitle="Мережа барбершопів: адреси, години роботи, статуси"
        actions={
          <Button variant="secondary" size="md" onClick={() => router.push('/locations/new')}>
            Додати локацію
          </Button>
        }
      />
      <ListStateRegion
        state={{
          loading,
          error,
          retrying,
          empty: locations.length === 0,
          onRetry: () => void fetchLocations(true),
        }}
        emptyTitle="Локацій ще немає"
        emptyDescription="Створіть першу локацію, щоб почати працювати."
        emptyAction={<Link href="/locations/new">Додати локацію</Link>}
        skeleton={
          <div className="flex flex-col gap-4" data-testid="list-skeleton">
            <Skeleton variant="rect" className="h-10 w-48" />
            <Skeleton variant="rect" className="h-64" />
          </div>
        }
      >
        <LocationsTable locations={locations} />
      </ListStateRegion>
    </div>
  );
}
