'use client';

// Головна адмінки: дані (календар дня + довідники) тут, розмітка — у
// DashboardView (LOC-гейт). Джерело — те саме, що сторінка «Календар»,
// тож цифри KPI не розходяться з календарем.
import { useEffect, useState } from 'react';
import DashboardView from './dashboard-view';
import { useAdminLive } from './components/use-admin-live';
import type { CalendarVisitDto, DashboardData } from './types';

/** Цивільна дата в локальній зоні. toISOString() — UTC, після півночі в Києві це вчора. */
function localIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const query = new URLSearchParams({
          date: localIsoDate(new Date()),
          view: 'day',
          reference: 'all',
        });
        const [calendarRes, barbersRes, locationsRes] = await Promise.all([
          fetch(`/admin/calendar?${query.toString()}`, { credentials: 'include' }),
          fetch('/admin/barbers', { credentials: 'include' }),
          fetch('/admin/locations', { credentials: 'include' }),
        ]);
        if (!calendarRes.ok || !barbersRes.ok || !locationsRes.ok) throw new Error('api');
        const { visits } = (await calendarRes.json()) as { visits: CalendarVisitDto[] };
        const barbers = (await barbersRes.json()) as DashboardData['barbers'];
        const locations = (await locationsRes.json()) as DashboardData['locations'];
        if (!alive) return;
        setData({ visits, barbers, locations });
        setFailed(false);
      } catch {
        if (alive) setFailed(true);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  // Живі події outbox-релея: новий візит одразу в KPI і списку дня.
  useAdminLive(reload);

  return <DashboardView data={data} failed={failed} onRetry={reload} />;
}
