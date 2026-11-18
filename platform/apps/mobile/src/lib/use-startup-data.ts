// Стартові дані екрана «Головна» з offline-кешем (T-4429): свіже з кешу без
// мережі, фонове оновлення, при офлайні — «застарілі» дані з банером.
import { useEffect, useRef, useState } from 'react';
import { fetchLocations, type LocationDto } from './api/locations';
import { fetchServices, type ServiceDto } from './api/catalog';
import { singleFlight, type CacheStorage } from './offline-cache';
import { loadStartupSection, type StartupKey } from './startup-data';
import { deviceStorage } from './cache-storage';

export interface StartupState {
  loading: boolean;
  stale: boolean;
  locations: LocationDto[];
  services: ServiceDto[];
}

function loadSection<T>(storage: CacheStorage, key: StartupKey, fetcher: () => Promise<T>) {
  return singleFlight(`startup:${key}`, () =>
    loadStartupSection<T>({ storage, now: Date.now() }, key, fetcher)
  );
}

export function useStartupData(storage: CacheStorage = deviceStorage()): StartupState {
  const [state, setState] = useState<StartupState>({
    loading: true,
    stale: false,
    locations: [],
    services: [],
  });
  const storageRef = useRef(storage);

  useEffect(() => {
    let alive = true;
    Promise.all([
      loadSection(storageRef.current, 'locations', fetchLocations),
      loadSection(storageRef.current, 'services', fetchServices),
    ])
      .then(([locs, srvs]) => {
        if (!alive) return;
        setState({
          loading: false,
          stale: locs.stale || srvs.stale,
          locations: locs.data,
          services: srvs.data,
        });
      })
      .catch(() => {
        // Перший запуск без мережі й без кешу: порожній стан, без баннера.
        if (alive) setState((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
