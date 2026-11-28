'use client';

// T-4516: завантаження каталогу — окремий стан регіону (loading/error/retry),
// а не змішаний з помилками форм створення й редагування послуг.
import { useCallback, useEffect, useState } from 'react';
import type { CatalogService, ServiceLocation } from './service-types';

export function useCatalog() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    // prettier-ignore
    const [res, locRes] = await Promise.all([fetch('/admin/services', { credentials: 'include' }), fetch('/admin/locations', { credentials: 'include' })]);
    if (!res.ok || !locRes.ok) throw new Error();
    setServices((await res.json()) as CatalogService[]);
    setLocations((await locRes.json()) as ServiceLocation[]);
  }, []);

  const load = useCallback(
    async (isRetry = false) => {
      if (isRetry) setRetrying(true);
      else setLoading(true);
      setLoadError(null);
      try {
        await reload();
      } catch {
        setLoadError('Не вдалося завантажити каталог');
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    },
    [reload]
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    services,
    locations,
    loading,
    retrying,
    loadError,
    reload,
    retry: () => void load(true),
  };
}
