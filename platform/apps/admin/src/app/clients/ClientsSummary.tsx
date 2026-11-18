'use client';

// Стрічка підсумків списку клієнтів (T-4606b, admin-screens §6.1/§8): KPI-картки
// за патерном T-111 плюс розподіли за лояльністю і за локацією останнього
// візиту. Формула показника живе в `title` картки: окремого Tooltip-примітива
// в дизайн-системі ще немає (його додає T-4507), тож підпис не робимо
// необов'язковим елементом розмітки, а значення лишається читабельним.
import { Card } from '@fade/ui';
import { FilterSelect } from '../components/FilterSelect';
import type { ClientListSummary } from './client-list-types';
import type { SummaryPeriod } from './client-list-query';
import { loyaltyRows, locationRows, summaryMetrics, windowLabel } from './clients-summary-metrics';

/** Вікно підсумків: контракт API — 7d/30d/90d (T-4606 §6.1). */
export const PERIOD_OPTIONS = [
  { value: '7d', label: 'Тиждень' },
  { value: '30d', label: 'Місяць' },
  { value: '90d', label: '3 місяці' },
];

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div>
      <p className="text-body text-fg-muted">{title}</p>
      <ul className="mt-4 flex flex-col">
        {rows.map((row) => (
          <li key={row.label} className="flex items-baseline justify-between gap-4 text-body">
            <span className="text-fg-secondary">{row.label}</span>
            <span className="font-semibold text-fg">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ClientsSummary({
  summary,
  period,
  onPeriod,
  locationName,
}: {
  summary: ClientListSummary;
  period: SummaryPeriod;
  onPeriod: (period: string) => void;
  locationName: (locationId: string) => string;
}) {
  return (
    <section aria-label="Підсумки по фільтру клієнтів" className="mb-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-body font-semibold text-fg">Підсумки</h2>
        <FilterSelect label="Період" value={period} options={PERIOD_OPTIONS} onChange={onPeriod} />
        <p className="text-body text-fg-secondary">{windowLabel(summary)}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics(summary).map((metric) => (
          <Card key={metric.key} title={metric.formula} data-testid={`summary-${metric.key}`}>
            <p className="text-body text-fg-muted">{metric.label}</p>
            <p className="font-display text-h3">{metric.value}</p>
          </Card>
        ))}
        <Card className="sm:col-span-2">
          <Breakdown title="За лояльністю" rows={loyaltyRows(summary)} />
        </Card>
        <Card className="sm:col-span-2">
          <Breakdown
            title="За локацією останнього візиту"
            rows={locationRows(summary, locationName)}
          />
        </Card>
      </div>
    </section>
  );
}
