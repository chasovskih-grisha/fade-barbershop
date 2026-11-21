'use client';

// T-180: Поточні параметри черги очікування — лише читання, без локального стану.
import { Card } from '@fade/ui';
import type { WaitlistConfiguration } from '../hooks/use-waitlist-config';

const ROWS: Array<{ label: string; value: (config: WaitlistConfiguration) => string | number }> = [
  { label: 'Max hold time (minutes)', value: (config) => config.maxHoldTimeMinutes },
  { label: 'Max missed slots pause', value: (config) => config.maxMissedSlotsPause },
  {
    label: 'Min slot hold duration (minutes)',
    value: (config) => config.minSlotHoldDurationMinutes,
  },
  { label: 'Cascade enabled', value: (config) => (config.enableCascade ? 'Yes' : 'No') },
  {
    label: 'Auto promotion enabled',
    value: (config) => (config.autoPromotionEnabled ? 'Yes' : 'No'),
  },
  {
    label: 'Priority scoring enabled',
    value: (config) => (config.priorityScoringEnabled ? 'Yes' : 'No'),
  },
];

export default function WaitlistConfigCard({ config }: { config: WaitlistConfiguration | null }) {
  return (
    <Card>
      <h2 className="text-h4 text-fg">Waitlist configuration</h2>
      {config ? (
        <div className="mt-3 flex flex-col gap-2">
          {ROWS.map((row) => (
            <div key={row.label}>
              <span className="text-fg-secondary">{row.label}:</span>{' '}
              <span className="text-fg">{row.value(config)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-fg-muted">Loading configuration...</p>
      )}
    </Card>
  );
}
