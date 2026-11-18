'use client';

import { Card, EmptyState } from '@fade/ui';
import type { AnalyticsMetrics } from './analytics-types';

export function AnalyticsStatusBreakdown({ metrics }: { metrics: AnalyticsMetrics }) {
  return (
    <Card className="p-6 flex flex-col gap-4">
      <h3 className="font-display text-h4 font-bold">Розподіл візитів за статусами</h3>
      {metrics.totalVisits === 0 ? (
        <EmptyState
          title="Немає даних за обраними фільтрами"
          description="Спробуйте змінити період, локацію або майстра в фільтрах вище."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-input border border-line bg-surface p-4 flex flex-col gap-1">
            <span className="text-caption text-fg-muted">Затверджені / Завершені</span>
            <span className="font-display text-h4 font-bold text-semantic-success">
              {metrics.completedVisits}
            </span>
          </div>
          <div className="rounded-input border border-line bg-surface p-4 flex flex-col gap-1">
            <span className="text-caption text-fg-muted">Скасовані</span>
            <span className="font-display text-h4 font-bold text-semantic-danger">
              {metrics.cancelledVisits}
            </span>
          </div>
          <div className="rounded-input border border-line bg-surface p-4 flex flex-col gap-1">
            <span className="text-caption text-fg-muted">Ефективність завантаження</span>
            <span className="font-display text-h4 font-bold text-accent-blue">
              {metrics.occupancyRate}%
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
