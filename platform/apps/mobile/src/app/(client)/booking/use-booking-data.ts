import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { fetchBarbers, type BarberDto } from '../../../lib/api/barbers';
import { fetchLocations, type LocationDto } from '../../../lib/api/locations';
import { fetchBookingServices, type BookingServiceDto } from '../../../lib/api/booking';

/** Catalog and studio for the first two booking steps. */
export function useBookingData(
  locationCode: string | undefined,
  setError: Dispatch<SetStateAction<string | null>>
) {
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [services, setServices] = useState<BookingServiceDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      try {
        const locations = await fetchLocations();
        if (!active) return;
        const found = locationCode
          ? locations.find((item) => item.code === locationCode)
          : locations.find((item) => item.active);
        if (!found) throw new Error('Студію не знайдено');
        setLocation(found);

        const [serviceResult, barberResult] = await Promise.allSettled([
          fetchBookingServices(found.id),
          fetchBarbers(found.id),
        ]);
        if (!active) return;
        if (serviceResult.status === 'fulfilled') setServices(serviceResult.value);
        else setError(messageOf(serviceResult.reason, 'Помилка послуг'));
        if (barberResult.status === 'fulfilled') setBarbers(barberResult.value);
        else setError(messageOf(barberResult.reason, 'Помилка майстрів'));
      } catch (reason) {
        if (active) setError(messageOf(reason, 'Помилка мережі'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [locationCode, setError]);

  return { location, services, barbers, loading };
}

function messageOf(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}
