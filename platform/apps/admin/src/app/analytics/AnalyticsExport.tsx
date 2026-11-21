'use client';

import { Card } from '@fade/ui';
import type { AnalyticsMetrics, AnalyticsFiltersState } from './analytics-types';

export function AnalyticsExport({
  metrics,
  filters,
}: {
  metrics: AnalyticsMetrics;
  filters: AnalyticsFiltersState;
}) {
  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Period', filters.period],
      ['Location ID', filters.locationId],
      ['Barber ID', filters.barberId],
      ['Total Visits', metrics.totalVisits],
      ['Completed Visits', metrics.completedVisits],
      ['Cancelled Visits', metrics.cancelledVisits],
      ['Total Revenue (UAH)', metrics.totalRevenue],
      ['Occupancy Rate (%)', metrics.occupancyRate],
      ['Completion Rate (%)', metrics.completionRate],
      [],
      ['Barber ID', 'Barber Name', 'Visits Count', 'Revenue (UAH)'],
      ...metrics.barberPerformance.map((bp) => [
        bp.barberId,
        bp.barberName,
        bp.visitsCount,
        bp.revenue,
      ]),
    ];

    const csvContent = rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `fade_analytics_report_${filters.period}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJson = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      filters,
      metrics,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `fade_analytics_report_${filters.period}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-5 flex items-center justify-between flex-wrap gap-4 bg-surface-raised border border-line">
      <div className="flex flex-col gap-1">
        <h4 className="font-display text-h5 font-bold text-fg">Експорт звітності</h4>
        <p className="font-text text-caption text-fg-muted">
          Завантажте повний звіт операційних метрик та продуктивності майстрів у форматі CSV або
          JSON.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-10 items-center justify-center rounded-input bg-interactive px-4 font-text font-medium text-fg hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          aria-label="Експортувати звіт у форматі CSV"
        >
          Експорт CSV
        </button>
        <button
          type="button"
          onClick={exportJson}
          className="inline-flex h-10 items-center justify-center rounded-input bg-accent px-4 font-text font-medium text-accent-fg hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          aria-label="Експортувати звіт у форматі JSON"
        >
          Експорт JSON
        </button>
      </div>
    </Card>
  );
}
