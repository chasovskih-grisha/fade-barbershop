'use client';

import { useState } from 'react';
import { conversionIntelligence, conversionHealthAnalytics, trackEvent } from '@/lib/analytics';

/** State and analytics actions for the conversion diagnostic widget. */
export function useConversionDiagnostic(
  initialStartedCount: number,
  initialCompletedCount: number
) {
  const [startedCount] = useState(initialStartedCount);
  const [completedCount] = useState(initialCompletedCount);
  const [isSimulating, setIsSimulating] = useState(false);

  const healthScore = conversionHealthAnalytics.calculateFunnelHealthScore(
    completedCount,
    startedCount
  );

  const handleSimulateDropoffRisk = () => {
    setIsSimulating(true);
    conversionIntelligence.trackDropOffRisk(
      'slot_selection_step',
      'User lingering over fully booked slots during peak evening hours'
    );
    trackEvent('conversion_diagnostic_simulated', {
      action: 'drop_off_risk',
      health_score: healthScore,
    });
    setTimeout(() => setIsSimulating(false), 1200);
  };

  const handleRunAudit = () => {
    trackEvent('conversion_audit_executed', {
      started_count: startedCount,
      completed_count: completedCount,
      health_score: healthScore,
      timestamp: Date.now(),
    });
    alert(
      `[FADE Analytics] Аудит конверсійної воронки успішно виконано!\nПоказник здоров'я воронки (Funnel Health Score): ${healthScore}%\nСтатус: Оптимізовано для високої конверсії (P1).`
    );
  };

  return {
    startedCount,
    completedCount,
    healthScore,
    isSimulating,
    handleSimulateDropoffRisk,
    handleRunAudit,
  };
}
