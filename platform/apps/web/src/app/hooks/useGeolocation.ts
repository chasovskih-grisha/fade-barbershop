'use client';

// useGeolocation — обгортка navigator.geolocation для «найближчої локації»
// (web-screens §1, фаза 9+). Точність не критична (місто), тому
// enableHighAccuracy вимкнено. Приватність: координати лише в пам'яті
// компонента, нікуди не логуються; на сервер ідуть тільки як query /locations/nearest.

import { useCallback, useRef, useState } from 'react';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export type GeoStatus =
  | 'idle' // ще не питали
  | 'locating' // чекаємо відповідь браузера
  | 'granted' // координати отримано
  | 'denied' // користувач заборонив (код 1)
  | 'unavailable' // пристрій не може визначити (код 2)
  | 'timeout' // занадто довго (код 3)
  | 'unsupported'; // немає geolocation (старий браузер / неsecure-контекст)

const GEO_TIMEOUT_MS = 8000;
const GEO_MAX_AGE_MS = 5 * 60 * 1000; // 5 хв — для вибору міста цього достатньо

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const inFlight = useRef(false);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || typeof navigator.geolocation === 'undefined') {
      setStatus('unsupported');
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus((s) => (s === 'granted' ? s : 'locating'));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        inFlight.current = false;
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus('granted');
      },
      (error) => {
        inFlight.current = false;
        // Коди GeolocationPositionError: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT.
        setStatus(error.code === 1 ? 'denied' : error.code === 2 ? 'unavailable' : 'timeout');
      },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS }
    );
  }, []);

  /** Скидає вибір: список повертається до звичайного порядку. */
  const reset = useCallback(() => {
    setCoords(null);
    setStatus('idle');
  }, []);

  return { status, coords, request, reset };
}
