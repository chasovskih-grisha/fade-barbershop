'use client';

import { useState } from 'react';
import { Card } from '@fade/ui';
import type { AnalyticsMetrics } from '../analytics-types';
import ConversionControls from './conversion-controls';
import ConversionInsights from './conversion-insights';
import ConversionReportCards from './ConversionReportCards';
import type { AttributionModel, TimeWindow } from './conversion-channels';
import { buildConversionReport } from './conversion-report';

export type { ConversionIntelligenceReport } from './conversion-report';

export function ConversionIntelligenceManager({ metrics }: { metrics: AnalyticsMetrics }) {
  const [attributionModel, setAttributionModel] = useState<AttributionModel>('last-click');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const report = buildConversionReport(metrics);

  return (
    <Card className="p-6 flex flex-col gap-6">
      <ConversionControls
        attributionModel={attributionModel}
        onAttributionModel={setAttributionModel}
        timeWindow={timeWindow}
        onTimeWindow={setTimeWindow}
      />
      <ConversionReportCards report={report} />
      <ConversionInsights report={report} attributionModel={attributionModel} />
    </Card>
  );
}
