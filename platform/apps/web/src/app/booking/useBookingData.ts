'use client';

// Дані флоу запису (T-041): каталог і барбери локації + вільні слоти на дату.
// Відокремлено від стану виборів за LOC-гейтом (ADR 0019).
// T-053h: waitlist integration
import { useEffect, useState } from 'react';
import { listBarbers, listServices, listSlots } from './bookingApi';
import { cancellable, noopCleanup } from './cancellable';
import { useWaitlist } from './useWaitlist';
import type { AvailableSlotDto, BarberDto, LocationDto, ServiceDto } from './types';

export function useBookingData(input: {
  location: LocationDto | null;
  service: ServiceDto | null;
  barberId: string;
  date: string;
}) {
  const { location, service, barberId, date } = input;
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [slots, setSlots] = useState<AvailableSlotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const waitlistFeature = useWaitlist({ location, service, barberId, date, setLoading, setError });
  const { setWaitlist } = waitlistFeature;

  const loadServices = () => {
    if (!location) return noopCleanup;
    return cancellable(listServices(location.id), {
      onSuccess: (s) => {
        setServices(s);
        setError('');
      },
      onError: () => setError('Не вдалося завантажити послуги'),
      setLoading,
    });
  };

  // Крок 2 (T-4521): барбери звужуються до тих, хто виконує обрану послугу.
  const loadBarbers = (reportError: boolean) => {
    if (!location) return noopCleanup;
    return cancellable(listBarbers(location.id, service?.id), {
      onSuccess: (b) => {
        setBarbers(b);
        if (reportError) setError('');
      },
      onError: reportError
        ? () => setError('Не вдалося завантажити барберів')
        : () => setBarbers([]),
      setLoading: reportError ? setLoading : undefined,
    });
  };

  const loadSlots = (hideWaitlist: boolean) => {
    if (!location || !service) return noopCleanup;
    return cancellable(
      listSlots({
        locationId: location.id,
        date,
        serviceId: service.id,
        ...(barberId ? { barberId } : {}),
      }),
      {
        onSuccess: (s) => {
          setSlots(s);
          setError('');
          if (hideWaitlist && s.length > 0) setWaitlist({});
        },
        onError: () => setError('Не вдалося завантажити слоти'),
        setLoading,
      }
    );
  };

  useEffect(() => loadServices(), [location]);
  useEffect(() => loadBarbers(false), [location, service]);
  useEffect(() => loadSlots(true), [location, service, date, barberId]);

  return {
    services,
    barbers,
    slots,
    loading,
    error,
    setError,
    ...waitlistFeature,
    retryServices: loadServices,
    retryBarbers: () => loadBarbers(true),
    retrySlots: () => loadSlots(false),
  };
}
