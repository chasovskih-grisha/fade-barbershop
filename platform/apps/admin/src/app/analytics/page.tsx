'use client';

import AnalyticsManager from './AnalyticsManager';
import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';

export default function AnalyticsPage() {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsManager />
    </AnalyticsErrorBoundary>
  );
}
