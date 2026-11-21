'use client';

import { useState } from 'react';
import { Card } from '@fade/ui';
import type { AnalyticsMetrics } from '../analytics-types';
import ConversionFunnelStepRow from './ConversionFunnelStepRow';
import { funnelSteps, type DeviceFilter } from './conversion-funnel-steps';

export type { FunnelStepData } from './conversion-funnel-steps';

export function ConversionFunnelHeatmap({ metrics: _metrics }: { metrics: AnalyticsMetrics }) {
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const steps = funnelSteps(deviceFilter);

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-h3 font-bold text-fg">
            Теплова карта воронки конверсій (ANL-HEAT-03)
          </h3>
          <p className="text-body text-fg-muted">
            Аналіз вузьких місць та інтенсивності відтоку користувачів за кроками
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-fg-secondary font-medium">Пристрій:</span>
          <select
            value={deviceFilter}
            onChange={(event) => setDeviceFilter(event.target.value as DeviceFilter)}
            className="rounded-input border border-border bg-surface px-3 py-1.5 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">Усі пристрої (All Platforms)</option>
            <option value="mobile">Мобільний додаток (iOS / Android)</option>
            <option value="web">Веб-кабінет (Web Browser)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {steps.map((step) => (
          <ConversionFunnelStepRow key={step.stepNumber} step={step} />
        ))}
      </div>

      <div className="p-4 rounded-card border border-line bg-surface flex flex-col gap-2">
        <h4 className="font-display text-h4 font-bold text-fg">
          Рекомендація Conversion Intelligence
        </h4>
        <p className="text-body-sm text-fg-muted">
          Найбільший відтік — крок №3 (вибір часу, 25.8%). Рекомендується вибір найближчого вільного
          слота в один клік.
        </p>
      </div>
    </Card>
  );
}
