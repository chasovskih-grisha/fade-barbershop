'use client';

// Передзаповнення флоу запису за наміром повторного запису (T-4617b).
// Читає ?location / ?service / ?barber, підставляє чинні поля і відкриває
// перший крок, який ще треба обрати. Валідний параметр — крок пройдено;
// невідомий лишається порожнім, крок вибору відкривається звичайно.

import { useEffect, useRef, useState } from 'react';
import { readBookAgainParams } from '@/app/account/appointments/book-again';
import type { LocationDto, ServiceDto } from './types';

/** Перший крок, який треба обрати: локація → послуга → слот (барбер
 * необов'язковий, «Будь-який» — дефолт). */
export function prefillStep(hasLocation: boolean, hasService: boolean): number {
  if (!hasLocation) return 0;
  if (!hasService) return 1;
  return 3;
}

async function findLocation(id: string): Promise<LocationDto | null> {
  const res = await fetch('/locations');
  if (!res.ok) return null;
  const list = (await res.json()) as LocationDto[];
  return list.find((loc) => loc.id === id) ?? null;
}

function currentSearch(): string {
  return typeof window !== 'undefined' ? window.location.search : '';
}

export function useBookAgainPrefill(input: {
  services: ServiceDto[];
  setLocation: (location: LocationDto) => void;
  setService: (service: ServiceDto) => void;
  setStep: (step: number) => void;
}) {
  const { services, setLocation, setService, setStep } = input;
  const [params] = useState(() => readBookAgainParams(currentSearch()));
  const [location, setResolvedLocation] = useState<LocationDto | null>(null);
  const stepped = useRef(false);

  useEffect(() => {
    const id = params.location;
    if (!id) return;
    let cancelled = false;
    void findLocation(id).then((found) => {
      if (!cancelled && found) setResolvedLocation(found);
    });
    return () => {
      cancelled = true;
    };
  }, [params.location]);

  useEffect(() => {
    if (location) setLocation(location);
  }, [location, setLocation]);

  const service = params.service ? services.find((svc) => svc.id === params.service) : undefined;
  useEffect(() => {
    if (service) setService(service);
  }, [service, setService]);

  useEffect(() => {
    if (stepped.current) return;
    const hasLocation = Boolean(params.location && location);
    const hasService = Boolean(service);
    // Чекаємо, доки локацію вирішено: без неї послуги ще не завантажені.
    if (params.location && !location && !service) return;
    stepped.current = true;
    setStep(prefillStep(hasLocation, hasService));
  }, [params.location, location, service, setStep]);
}
