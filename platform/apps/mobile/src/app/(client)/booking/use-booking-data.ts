import { useEffect, useState } from 'react';
import { fetchBarbers, type BarberDto } from '../../../lib/api/barbers';
import { fetchLocations, type LocationDto } from '../../../lib/api/locations';
import { fetchServices, type ServiceDto } from '../../../lib/api/catalog';

export function useBookingData(location: LocationDto | null) {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const list = await fetchLocations();
        if (!mounted) return;
        setLocations(list);
        const [serviceList, barberList] = await Promise.all([
          fetchServices(),
          fetchBarbers(location?.id ?? list[0]?.id ?? ''),
        ]);
        if (!mounted) return;
        setServices(serviceList);
        setBarbers(barberList);
        setFailed(false);
      } catch {
        if (mounted) setFailed(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [location?.id]);

  return { locations, services, barbers, loading, failed };
}
