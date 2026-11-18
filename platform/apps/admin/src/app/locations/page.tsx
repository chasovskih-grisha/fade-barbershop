'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, EmptyState, Skeleton } from '@fade/ui';
import PageHeader from '../components/PageHeader';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const res = await fetch('/admin/locations', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load locations');
        setLocations((await res.json()) as Location[]);
      } catch {
        setError('Не вдалося завантажити локації');
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton variant="rect" className="h-10 w-48" />
        <Skeleton variant="rect" className="h-64" />
      </div>
    );
  }

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
      {error && (
        <div role="alert" className="mb-4 text-semantic-danger">
          {error}
        </div>
      )}
      {locations.length === 0 ? (
        <EmptyState
          title="Локацій ще немає"
          description="Створіть першу локацію, щоб почати працювати."
          action={<Link href="/locations/new">Додати локацію</Link>}
        />
      ) : (
        <LocationsTable locations={locations} />
      )}
    </div>
  );
}
