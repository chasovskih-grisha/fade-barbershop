'use client';

import { Card } from '@fade/ui';
import FunnelEventRow from './funnel-event-row';
import { useFunnelTelemetry } from './use-funnel-telemetry';

export type { FunnelTelemetryEvent } from './funnel-telemetry';

export function AnalyticsFunnelLiveStream() {
  const { events, isLivePaused, togglePause } = useFunnelTelemetry();

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-semantic-success animate-pulse" />
            <h3 className="font-display text-h4 font-bold text-fg">
              Потоковий моніторинг телеметрії воронок (ANL-LIVE-03)
            </h3>
          </div>
          <p className="text-body text-fg-muted">
            Реєстрація подій поведінкової воронки бронювання в реальному часі
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePause}
            className="rounded-input border border-border bg-surface px-3 py-1.5 text-body-sm font-medium text-fg hover:bg-surface-raised transition-colors"
          >
            {isLivePaused ? '▶ Продовжити потік' : '⏸ Пауза потоку'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {events.map((ev) => (
          <FunnelEventRow key={ev.id} event={ev} />
        ))}
      </div>
    </Card>
  );
}
