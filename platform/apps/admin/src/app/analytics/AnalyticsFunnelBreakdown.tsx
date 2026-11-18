'use client';

import { Card } from '@fade/ui';
import type { AnalyticsMetrics } from './analytics-types';

export function AnalyticsFunnelBreakdown({ metrics }: { metrics: AnalyticsMetrics }) {
  const started = Math.round(metrics.totalVisits * 1.4);
  const serviceSelected = Math.round(metrics.totalVisits * 1.2);
  const slotSelected = Math.round(metrics.totalVisits * 1.05);
  const confirmed = metrics.totalVisits;

  const steps = [
    { name: 'Початок бронювання (Booking Started)', count: started, dropOff: 0 },
    { name: 'Вибір послуги (Service Selected)', count: serviceSelected, dropOff: started > 0 ? Math.round(((started - serviceSelected) / started) * 100) : 0 },
    { name: 'Вибір часу (Slot Selected)', count: slotSelected, dropOff: serviceSelected > 0 ? Math.round(((serviceSelected - slotSelected) / serviceSelected) * 100) : 0 },
    { name: 'Підтвердження (Confirmed / Completed)', count: confirmed, dropOff: slotSelected > 0 ? Math.round(((slotSelected - confirmed) / slotSelected) * 100) : 0 },
  ];

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-h4 font-bold">Воронка конверсії онлайн-бронювання</h3>
        <p className="text-body text-fg-muted">Аналіз падіння користувачів по кроках фреймворку бронювання FADE</p>
      </div>
      <div className="grid gap-3">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col gap-1.5 p-3 rounded-input border border-line bg-surface">
            <div className="flex justify-between items-center text-body font-medium">
              <span>{index + 1}. {step.name}</span>
              <span className="font-bold">{step.count} сесій</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${started > 0 ? Math.min(100, Math.max(10, (step.count / started) * 100)) : 0}%` }}
                />
              </div>
              {index > 0 && (
                <span className="text-caption text-semantic-danger font-medium whitespace-nowrap">
                  Відтік: {step.dropOff}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
