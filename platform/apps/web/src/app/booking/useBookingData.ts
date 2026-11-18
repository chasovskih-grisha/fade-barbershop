'use client';

// Дані флоу запису (T-041): каталог і барбери локації + вільні слоти на дату.
// Відокремлено від стану виборів за LOC-гейтом (ADR 0019).
// T-053h: waitlist integration
import { useEffect, useState } from 'react';
import { listBarbers, listServices, listSlots } from './bookingApi';
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
  const [waitlist, setWaitlist] = useState<{
    entryId?: string;
    queuePosition?: number;
    estimatedWaitMinutes?: number;
  }>({});

  const retryServices = () => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    listServices(location.id)
      .then((s) => {
        if (!cancelled) {
          setServices(s);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити послуги');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  // Крок 2 (T-4521): барбери звужуються до тих, хто виконує обрану послугу.
  const retryBarbers = () => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    listBarbers(location.id, service?.id)
      .then((b) => {
        if (!cancelled) {
          setBarbers(b);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити барберів');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  const retrySlots = () => {
    if (!location || !service) return;
    let cancelled = false;
    setLoading(true);
    // prettier-ignore
    listSlots({ locationId: location.id, date, serviceId: service.id, ...(barberId ? { barberId } : {}) })
      .then((s) => {
        if (!cancelled) {
          setSlots(s);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити слоти');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  const joinWaitlist = () => {
    if (!location || !service) return;
    let cancelled = false;
    setLoading(true);
    listSlots({
      locationId: location.id,
      date,
      serviceId: service.id,
      ...(barberId ? { barberId } : {}),
    })
      .then(() => {
        // Slots exist - don't join waitlist; user can pick a slot instead
      })
      .catch(async () => {
        // No slots available - join waitlist
        const result = await fetch('/booking/waitlist/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId: location.id, serviceId: service.id, barberId }),
        }).then((r) => r.json());
        if (!cancelled) {
          setWaitlist({
            entryId: result.entryId,
            queuePosition: result.queuePosition,
            estimatedWaitMinutes: result.estimatedWaitMinutes,
          });
          setError('');
          setLoading(false);
          // TODO: show notification when slot opens
        }
      });
    return () => {
      cancelled = true;
    };
  };

  const cancelWaitlist = () => {
    if (!waitlist.entryId) return;
    let cancelled = false;
    setLoading(true);
    fetch('/booking/waitlist/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: waitlist.entryId }),
    })
      .then(() => {
        if (!cancelled) {
          setWaitlist({});
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося скасувати запис на waitlist');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  const getWaitlistPosition = () => {
    if (!waitlist.entryId) return;
    let cancelled = false;
    fetch('/booking/waitlist/position/' + waitlist.entryId)
      .then((r) => r.json())
      .then((result: { queuePosition: number; estimatedWaitMinutes: number }) => {
        if (!cancelled) {
          setWaitlist({
            ...waitlist,
            queuePosition: result.queuePosition,
            estimatedWaitMinutes: result.estimatedWaitMinutes,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося отримати позицію в черзі');
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    listServices(location.id)
      .then((s) => {
        if (!cancelled) {
          setServices(s);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити послуги');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location]);

  // Крок 2 (T-4521): список барберів залежить від обраної послуги.
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    listBarbers(location.id, service?.id)
      .then((b) => {
        if (!cancelled) setBarbers(b);
      })
      .catch(() => {
        if (!cancelled) setBarbers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [location, service]);

  useEffect(() => {
    if (!location || !service) return;
    let cancelled = false;
    setLoading(true);
    // prettier-ignore
    listSlots({ locationId: location.id, date, serviceId: service.id, ...(barberId ? { barberId } : {}) })
      .then((s) => {
        if (!cancelled) {
          setSlots(s);
          setError('');
          // Hide waitlist if slots become available
          if (s.length > 0) {
            setWaitlist({});
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити слоти');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location, service, date, barberId]);

  return {
    services,
    barbers,
    slots,
    loading,
    error,
    setError,
    waitlist,
    setWaitlist,
    retryServices,
    retryBarbers,
    retrySlots,
    joinWaitlist,
    cancelWaitlist,
    getWaitlistPosition,
  };
}
