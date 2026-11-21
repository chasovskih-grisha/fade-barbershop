'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards';
import { AnalyticsStatusBreakdown } from './AnalyticsStatusBreakdown';
import { AnalyticsStaffBreakdown } from './AnalyticsStaffBreakdown';
import { AnalyticsExport } from './AnalyticsExport';
import { AnalyticsLoadingState, AnalyticsErrorState } from './AnalyticsStates';
import { AnalyticsPeakHours } from './AnalyticsPeakHours';
import { AnalyticsFunnelBreakdown } from './AnalyticsFunnelBreakdown';
import { AnalyticsFunnelLiveStream } from './AnalyticsFunnelLiveStream';
import type { AnalyticsFiltersState, AnalyticsMetrics } from './analytics-types';
import type { CalendarVisitDto } from '../types';
import { computeMetrics } from './analytics-metrics';

export default function AnalyticsManager() {
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    period: 'day',
    locationId: 'all',
    barberId: 'all',
  });
  const [visits, setVisits] = useState<CalendarVisitDto[]>([]);
  const [barbers, setBarbers] = useState<{ id: string; name: string | null }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        view: filters.period === 'day' ? 'day' : 'week',
        reference: 'all',
      });
      const [calRes, barbersRes, locsRes] = await Promise.all([
        fetch(`/admin/calendar?${query.toString()}`, { credentials: 'include' }),
        fetch('/admin/barbers', { credentials: 'include' }),
        fetch('/admin/locations', { credentials: 'include' }),
      ]);
      if (!calRes.ok || !barbersRes.ok || !locsRes.ok) throw new Error();
      const calData = (await calRes.json()) as { visits: CalendarVisitDto[] };
      setVisits(calData.visits || []);
      setBarbers((await barbersRes.json()) as { id: string; name: string | null }[]);
      setLocations((await locsRes.json()) as { id: string; name: string }[]);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [filters]);

  const metrics: AnalyticsMetrics = useMemo(
    () => computeMetrics({ visits, filters, barbers, locations }),
    [visits, filters, barbers, locations]
  );

  if (loading && visits.length === 0) return <AnalyticsLoadingState />;
  if (failed) return <AnalyticsErrorState onRetry={() => void loadData()} />;

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Аналітика мережі"
        subtitle="Операційні метрики, завантаженість крісел та звітність засновника"
      />
      <AnalyticsFilters
        filters={filters}
        locations={locations}
        barbers={barbers}
        onChange={setFilters}
      />
      <AnalyticsSummaryCards metrics={metrics} />
      <AnalyticsPeakHours visits={visits} />
      <AnalyticsFunnelBreakdown metrics={metrics} />
      <AnalyticsFunnelLiveStream />
      <AnalyticsExport metrics={metrics} filters={filters} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsStatusBreakdown metrics={metrics} />
        <AnalyticsStaffBreakdown metrics={metrics} />
      </div>
    </main>
  );
}
