'use client';

// T-180: Зведені метрики черги очікування.
import { Card } from '@fade/ui';
import type { WaitlistSummary } from '../hooks/use-waitlist-config';

const METRICS: Array<{ label: string; value: (summary: WaitlistSummary) => string }> = [
  { label: 'Total waiting', value: (summary) => String(summary.totalWaiting) },
  { label: 'Average wait time (min)', value: (summary) => String(summary.averageWaitTime) },
  { label: 'Cascade activation rate', value: (summary) => `${summary.cascadeActivationRate}%` },
  { label: 'Promotion rate', value: (summary) => `${summary.promotionRate}%` },
];

export default function WaitlistSummaryCard({ summary }: { summary: WaitlistSummary | null }) {
  return (
    <Card>
      <h2 className="text-h4 text-fg">Real-time waitlist summary</h2>
      {summary ? (
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.label}>
              <p className="text-caption text-fg-muted">{metric.label}</p>
              <p className="text-h3 text-fg">{metric.value(summary)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-fg-muted">Loading summary...</p>
      )}
    </Card>
  );
}
