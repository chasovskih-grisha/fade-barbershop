'use client';

import { Card, EmptyState } from '@fade/ui';
import type { AnalyticsMetrics } from './analytics-types';

export function AnalyticsStaffBreakdown({ metrics }: { metrics: AnalyticsMetrics }) {
  return (
    <Card className="p-6 flex flex-col gap-4">
      <h3 className="font-display text-h4 font-bold">Продуктивність та виручка по майстрах</h3>
      {metrics.barberPerformance.length === 0 ? (
        <EmptyState
          title="Немає завершених візитів за обраними фільтрами"
          description="Дані з'являться після виконання записів майстрами."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body text-fg">
            <thead>
              <tr className="border-b border-line text-caption text-fg-muted">
                <th className="pb-3 font-medium">Майстер</th>
                <th className="pb-3 font-medium text-right">Завершено візитів</th>
                <th className="pb-3 font-medium text-right">Виручка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {metrics.barberPerformance.map((bp) => (
                <tr key={bp.barberId} className="hover:bg-surface-raised">
                  <td className="py-3 font-medium">{bp.barberName}</td>
                  <td className="py-3 text-right">{bp.visitsCount}</td>
                  <td className="py-3 text-right font-semibold text-semantic-success">
                    {bp.revenue} ₴
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
