'use client';

import Link from 'next/link';
import { useConversionDiagnostic } from './useConversionDiagnostic';
import { ConversionMetrics } from './ConversionMetrics';

interface ConversionDiagnosticWidgetProps {
  initialStartedCount?: number;
  initialCompletedCount?: number;
}

export function ConversionDiagnosticWidget({
  initialStartedCount = 1250,
  initialCompletedCount = 890,
}: ConversionDiagnosticWidgetProps) {
  const {
    startedCount,
    completedCount,
    healthScore,
    isSimulating,
    handleSimulateDropoffRisk,
    handleRunAudit,
  } = useConversionDiagnostic(initialStartedCount, initialCompletedCount);

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-surface-raised via-surface to-surface-sunken border border-accent/30 p-6 md:p-8 shadow-xl">
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-accent/20 border border-accent/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              <span>📊 FADE Conversion Intelligence • P1 Diagnostics</span>
            </div>
            <h2 className="text-h4 md:text-h3 font-display font-bold text-fg">
              Аналітика конверсії та здоров&apos;я воронки запису
            </h2>
            <p className="text-body text-fg-secondary mt-1">
              Моніторинг кроків запису в реальному часі, виявлення зон ризику відмов (drop-off) та
              оптимізація шляху клієнта.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-sunken border border-line rounded-[var(--radius-card)] px-5 py-3 shadow-inner shrink-0">
            <div className="flex flex-col">
              <span className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
                Funnel Health
              </span>
              <span className="text-2xl font-bold font-display text-accent">{healthScore}%</span>
            </div>
            <div className="h-8 w-px bg-line mx-1" />
            <div className="flex flex-col">
              <span className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
                Конверсія
              </span>
              <span className="text-sm font-semibold text-fg">
                {((completedCount / Math.max(1, startedCount)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <ConversionMetrics startedCount={startedCount} completedCount={completedCount} />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAudit}
              className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-6 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md active:scale-[0.98]"
            >
              Запустити повний аудит конверсій
            </button>
            <button
              onClick={handleSimulateDropoffRisk}
              disabled={isSimulating}
              className="inline-flex h-11 items-center justify-center rounded-input border border-line-strong bg-interactive px-5 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all active:scale-[0.98]"
            >
              {isSimulating ? 'Аналіз ризику...' : 'Симулювати Drop-off сигнал'}
            </button>
          </div>

          <Link
            href="/booking"
            className="text-sm font-semibold text-accent hover:underline inline-flex items-center gap-1.5"
          >
            <span>Перейти до тестового запису</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
