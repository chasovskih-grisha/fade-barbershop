'use client';

import { useState } from 'react';
import { Card } from '@fade/ui';
import type { AnalyticsMetrics } from '../analytics-types';
import CohortRetentionTable from './cohort-retention-table';
import { COHORTS } from './cohort-retention-data';

export type { CohortData } from './cohort-retention-data';

type Segment = 'all' | 'new-clients' | 'vip';

export function ConversionCohortRetentionReport({
  metrics: _metrics,
}: {
  metrics: AnalyticsMetrics;
}) {
  const [selectedSegment, setSelectedSegment] = useState<Segment>('all');

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-h3 font-bold text-fg">
            Когортний аналіз утримання (ANL-COHORT-02)
          </h3>
          <p className="text-body text-fg-muted">
            Аналіз повторних візитів та життєвого циклу клієнтів (Retention Cohorts)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-fg-secondary font-medium">Сегмент:</span>
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value as Segment)}
            className="rounded-input border border-border bg-surface px-3 py-1.5 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">Усі клієнти (All Clients)</option>
            <option value="new-clients">Нові клієнти (New Clients)</option>
            <option value="vip">VIP Клієнти (VIP Club)</option>
          </select>
        </div>
      </div>

      <CohortRetentionTable cohorts={COHORTS} />

      <div className="p-4 rounded-card border border-line bg-surface flex flex-col gap-2">
        <h4 className="font-display text-h4 font-bold text-fg">Аналітичні висновки FADE</h4>
        <p className="text-body-sm text-fg-muted">
          Показник утримання на 1-й місяць становить 68%, що на 5.2% перевищує бенчмарк галузі
          barbershop (62.8%). Найвищу повторюваність демонструє когорта клієнтів, які забронювали
          через мобільний додаток із застосуванням реферального промокоду.
        </p>
      </div>
    </Card>
  );
}
