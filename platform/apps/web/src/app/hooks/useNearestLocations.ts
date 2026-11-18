'use client';

// useNearestLocations — дані для списків локацій (флоу запису, /locations):
// GET /locations/nearest?lat&lng. Без координат ендпоінт повертає всі активні
// локації в порядку кодів — тож один ендпоінт обслуговує обидва стани.
// Геолокація запитується один раз при маунті; повторити можна кнопкою.

import { useCallback, useEffect, useState } from 'react';
import { NearestLocationsResponse } from '../booking/types';
import { useGeolocation, type GeoStatus } from './useGeolocation';

export function useNearestLocations(enabled = true) {
  const geo = useGeolocation();
  const [data, setData] = useState<NearestLocationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [requested, setRequested] = useState(false); // авто-запит лише раз

  useEffect(() => {
    if (enabled && !requested) {
      setRequested(true);
      geo.request();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, requested]);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    const query = geo.coords ? `?lat=${geo.coords.lat}&lng=${geo.coords.lng}` : '';
    fetch(`/locations/nearest${query}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json() as Promise<NearestLocationsResponse>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, geo.coords, reloadKey]);

  /** Повторити запит списку (наприклад, після мережевої помилки). */
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...geo, data, loading, error, refresh, retryGeo: geo.request, clearGeo: geo.reset };
}

export type { GeoStatus };
