'use client';

import { Card } from '@fade/ui';
import type { CalendarVisitDto } from '../types';

export function AnalyticsPeakHours({ visits }: { visits: CalendarVisitDto[] }) {
  let morning = 0; // 09:00 - 11:59
  let afternoon = 0; // 12:00 - 15:59
  let evening = 0; // 16:00 - 21:00

  for (const v of visits) {
    if (!v.start) continue;
    const date = new Date(v.start);
    const hour = date.getHours();
    if (hour >= 9 && hour < 12) morning++;
    else if (hour >= 12 && hour < 16) afternoon++;
    else if (hour >= 16 && hour <= 21) evening++;
  }

  const total = visits.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const slots = [
    { label: 'Ранок (09:00 – 12:00)', count: morning, percentage: pct(morning) },
    { label: 'День (12:00 – 16:00)', count: afternoon, percentage: pct(afternoon) },
    { label: 'Вечір (16:00 – 21:00)', count: evening, percentage: pct(evening) },
  ];

  return (
    <Card className="p-6 flex flex-col gap-4">
      <h3 className="font-display text-h4 font-bold">Пікові години навантаження</h3>
      <p className="text-body text-fg-muted">Розподіл записів за часовими інтервалами дня</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {slots.map((slot, idx) => (
          <div key={idx} className="rounded-input border border-line bg-surface p-4 flex flex-col gap-1">
            <span className="text-caption text-fg-muted">{slot.label}</span>
            <span className="font-display text-h4 font-bold text-fg">{slot.count} записів</span>
            <span className="text-caption text-accent-blue font-medium">{slot.percentage}% від загалу</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
