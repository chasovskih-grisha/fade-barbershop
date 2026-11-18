'use client';

// KPI-картки головної: візити дня, очікувані, виторг (лише завершені).
import { Card, formatMoney } from '@fade/ui';
import type { CalendarVisitDto } from './types';

export default function DashboardKpi({ visits }: { visits: CalendarVisitDto[] }) {
  const moneyToday = visits
    .filter((visit) => visit.status === 'completed' && visit.agreedPrice !== null)
    .reduce((sum, visit) => sum + (visit.agreedPrice ?? 0), 0);
  const expected = visits.filter(
    (visit) => visit.status === 'booked' || visit.status === 'confirmed'
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <p className="text-body text-fg-muted">Візити сьогодні</p>
        <p className="font-display text-h3">{visits.length}</p>
      </Card>
      <Card>
        <p className="text-body text-fg-muted">Очікується</p>
        <p className="font-display text-h3">{expected}</p>
      </Card>
      <Card>
        <p className="text-body text-fg-muted">Виторг за день</p>
        <p className="font-display text-h3">{formatMoney(moneyToday)}</p>
      </Card>
    </div>
  );
}
