import { useEffect, useState } from 'react';
import { fetchBarbers, listedBarbers } from '@/lib/api/barbers';
import { fetchLocations } from '@/lib/api/locations';
import { toOptions, type ChairOption } from './usual-chair';

/**
 * Довідники звичного місця (T-4725c): локації — з того самого `/locations`, що
 * й головна, барбери — лише обраної локації. Порожня локація тримає список
 * барберів порожнім, а збій запиту не малює пунктів із нічого.
 */
export function useUsualChairCatalog(locationId: string | null) {
  const [locations, setLocations] = useState<ChairOption[]>([]);
  const [barbers, setBarbers] = useState<ChairOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchLocations()
      .then((rows) => {
        if (alive) setLocations(toOptions(rows.filter((row) => row.active)));
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!locationId) {
      setBarbers([]);
      return () => {
        alive = false;
      };
    }
    fetchBarbers(locationId)
      .then((rows) => {
        if (alive) setBarbers(toOptions(listedBarbers(rows)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [locationId]);

  return { locations, barbers, loading, clearBarbers: () => setBarbers([]) };
}
