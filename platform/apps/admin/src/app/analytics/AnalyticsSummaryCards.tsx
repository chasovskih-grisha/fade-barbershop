'use client';

import { Card } from '@fade/ui';
import type { AnalyticsMetrics } from './analytics-types';

export function AnalyticsSummaryCards({ metrics }: { metrics: AnalyticsMetrics }) {
  const cards = [
    { title: 'Всього записів', value: metrics.totalVisits, desc: 'За обраний період' },
    { title: 'Завершено візитів', value: metrics.completedVisits, desc: `Виконано (${metrics.completionRate}%)` },
    { title: 'Загальна виручка', value: `${metrics.totalRevenue} ₴`, desc: 'Сума з виконаних записів' },
    { title: 'Завантаженість (Occupancy)', value: `${metrics.occupancyRate}%`, desc: 'Коефіцієнт зайнятості крісел' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="p-5 flex flex-col gap-2">
          <span className="font-text text-caption text-fg-muted">{card.title}</span>
          <div className="font-display text-h3 font-bold text-fg">{card.value}</div>
          <span className="font-text text-caption text-fg-muted">{card.desc}</span>
        </Card>
      ))}
    </div>
  );
}
