'use client';

// Послуги обраної локації для форми візиту (T-4738): список порожній, доки
// локацію не обрано, і це саме її каталог, а не першої локації довідника.
import { useCallback, useEffect, useState } from 'react';

export type ServiceOption = { id: string; name: string; duration: number };

type CatalogEntry = {
  id: string;
  name: string;
  duration: number;
  active?: boolean;
  prices?: { locationId: string; active?: boolean }[];
};

export function useLocationServices(locationId: string) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const load = useCallback(async () => {
    if (!locationId) {
      setServices([]);
      setState('idle');
      return;
    }
    setState('loading');
    try {
      const response = await fetch('/admin/services', { credentials: 'include' });
      if (!response.ok) throw new Error('services');
      const rows = (await response.json()) as CatalogEntry[];
      setServices(
        rows
          .filter((service) => service.active !== false)
          .filter((service) =>
            service.prices?.some(
              (price) => price.locationId === locationId && price.active !== false
            )
          )
          .map((service) => ({ id: service.id, name: service.name, duration: service.duration }))
      );
      setState('ready');
    } catch {
      setServices([]);
      setState('error');
    }
  }, [locationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { services, state };
}
