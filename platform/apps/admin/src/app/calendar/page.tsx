'use client';

// Календар мережі (T-045, admin-screens §5.1): тулбар фільтрів → сітка
// візитів → картка з діями життєвого циклу. Дані — хук useAdminCalendar
// (GET /admin/calendar); команди — VisitCard (POST /admin/appointments/:id/*).
import { useEffect, useState } from 'react';
import { EmptyState } from '@fade/ui';
import PageHeader from '../components/PageHeader';
import { useAdminLive } from '../components/use-admin-live';
import VisitCard from './VisitCard';
import CalendarToolbar, { type ToolbarState } from './CalendarToolbar';
import VisitsTable from './VisitsTable';
import { useAdminCalendar } from './useAdminCalendar';
import { ShiftConflictsPanel } from './ShiftConflictsPanel';

/** Цивільна дата в локальній зоні. toISOString() — UTC, після півночі в Києві це вчора. */
function localIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function CalendarPage() {
  const { authChecked, locations, barbers, visits, error, setError, loaded, reload } =
    useAdminCalendar();
  const [filters, setFilters] = useState<ToolbarState>({
    view: 'day',
    date: localIsoDate(new Date()),
    locationId: '',
    barberId: '',
    reference: 'all',
    status: '',
  });
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!authChecked) return;
    void reload(filters).catch(() => setError('Не вдалося завантажити календар'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, filters]);

  const selected = visits.find((visit) => visit.id === selectedId) ?? null;
  const refresh = () => setFilters((current) => ({ ...current }));

  // Живі події outbox-релея: новий візит на сітці без перезавантаження сторінки.
  useAdminLive(refresh);

  return (
    <div>
      <PageHeader
        title="Календар"
        subtitle="Візити мережі за день або тиждень; клік по рядку — дії життєвого циклу"
      />
      {/* T-4616b: барбер став недоступним — візити потребують рішення. */}
      <ShiftConflictsPanel />
      <CalendarToolbar
        state={filters}
        locations={locations}
        barbers={barbers}
        onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
        onRefresh={refresh}
      />
      {error && (
        <p role="alert" className="mt-3">
          {error}
        </p>
      )}
      {loaded && visits.length === 0 && !error && (
        <EmptyState
          className="mt-4"
          title="Візитів немає"
          description="Спробуйте іншу дату або зніміть фільтри"
        />
      )}
      {visits.length > 0 && (
        <VisitsTable
          visits={visits}
          locations={locations}
          barbers={barbers}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(selectedId === id ? '' : id)}
          onRescheduled={refresh}
        />
      )}
      {selected && <VisitCard visit={selected} onDone={refresh} />}
    </div>
  );
}
