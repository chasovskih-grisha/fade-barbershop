// Хук даних календаря (T-045): auth-гард, довідники локацій/барберів,
// перезавантаження візитів за фільтрами. Відокремлено від розмітки за
// LOC-гейтом (ADR 0019).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ToolbarState } from './CalendarToolbar';
import type { CalendarVisit } from './visit-status';

type Location = { id: string; name: string };
type Barber = { id: string; name: string | null };

export function useAdminCalendar() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [visits, setVisits] = useState<CalendarVisit[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/admin/auth/me', { credentials: 'include' });
        if (!res.ok) {
          router.push('/login');
          return;
        }
        setAuthChecked(true);
      } catch (_) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const loadDirectories = async () => {
      const [locationRes, barberRes] = await Promise.all([
        fetch('/admin/locations', { credentials: 'include' }),
        fetch('/admin/barbers', { credentials: 'include' }),
      ]);
      if (!locationRes.ok || !barberRes.ok) throw new Error();
      setLocations((await locationRes.json()) as Location[]);
      setBarbers((await barberRes.json()) as Barber[]);
    };
    void loadDirectories().catch(() => setError('Не вдалося завантажити довідники'));
  }, [authChecked]);

  const reload = async (filters: ToolbarState) => {
    const { view, date, locationId, barberId, reference, status } = filters;
    // prettier-ignore
    const query = new URLSearchParams({ date, view, reference, ...(locationId ? { locationId } : {}), ...(barberId ? { barberId } : {}), ...(status ? { status } : {}) });
    const response = await fetch(`/admin/calendar?${query.toString()}`, { credentials: 'include' });
    if (!response.ok) throw new Error();
    setVisits(((await response.json()) as { visits: CalendarVisit[] }).visits);
    setError('');
    setLoaded(true);
  };

  return { authChecked, locations, barbers, visits, error, setError, loaded, reload };
}
