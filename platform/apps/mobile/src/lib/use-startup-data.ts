// Стартові дані екрана «Головна» з offline-кешем (T-4429): свіже з кешу без
// мережі, фонове оновлення, при офлайні — «застарілі» дані з банером.
// T-4846: локації й послуги — два незалежні запити. Один, що впав, не стирає
// другий: у кожної секції свій статус і свій повтор.
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLocations, type LocationDto } from './api/locations';
import { fetchServices, type ServiceDto } from './api/catalog';
import { singleFlight, type CacheStorage } from './offline-cache';
import { loadStartupSection, type StartupKey } from './startup-data';
import { deviceStorage } from './cache-storage';

/** `loading` — запит у дорозі, `error` — запит упав і даних немає. */
export type StartupSectionStatus = 'loading' | 'ready' | 'error';

export interface StartupSection<T> {
  data: T;
  status: StartupSectionStatus;
  stale: boolean;
}

export interface StartupState {
  loading: boolean;
  stale: boolean;
  locations: StartupSection<LocationDto[]>;
  services: StartupSection<ServiceDto[]>;
  /** Повторний запит своєї секції; іншу секцію не чіпає. */
  retryLocations: () => void;
  retryServices: () => void;
}

function loadSection<T>(storage: CacheStorage, key: StartupKey, fetcher: () => Promise<T>) {
  return singleFlight(`startup:${key}`, () =>
    loadStartupSection<T>({ storage, now: Date.now() }, key, fetcher)
  );
}

const initialSection = <T,>(data: T): StartupSection<T> => ({
  data,
  status: 'loading',
  stale: false,
});

export function useStartupData(storage: CacheStorage = deviceStorage()): StartupState {
  const storageRef = useRef(storage);
  const aliveRef = useRef(true);
  const [locations, setLocations] = useState<StartupSection<LocationDto[]>>(() =>
    initialSection<LocationDto[]>([])
  );
  const [services, setServices] = useState<StartupSection<ServiceDto[]>>(() =>
    initialSection<ServiceDto[]>([])
  );

  const loadLocations = useCallback(() => {
    setLocations((prev) => ({ ...prev, status: 'loading' }));
    loadSection<LocationDto[]>(storageRef.current, 'locations', fetchLocations)
      .then((res) => {
        if (aliveRef.current) setLocations({ data: res.data, status: 'ready', stale: res.stale });
      })
      .catch(() => {
        if (aliveRef.current) setLocations({ data: [], status: 'error', stale: false });
      });
  }, []);

  const loadServices = useCallback(() => {
    setServices((prev) => ({ ...prev, status: 'loading' }));
    loadSection<ServiceDto[]>(storageRef.current, 'services', fetchServices)
      .then((res) => {
        if (aliveRef.current) setServices({ data: res.data, status: 'ready', stale: res.stale });
      })
      .catch(() => {
        if (aliveRef.current) setServices({ data: [], status: 'error', stale: false });
      });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    loadLocations();
    loadServices();
    return () => {
      aliveRef.current = false;
    };
  }, [loadLocations, loadServices]);

  return {
    loading: locations.status === 'loading' || services.status === 'loading',
    stale: locations.stale || services.stale,
    locations,
    services,
    retryLocations: loadLocations,
    retryServices: loadServices,
  };
}
