'use client';

import type { AttributionModel, TimeWindow } from './conversion-channels';

export default function ConversionControls({
  attributionModel,
  onAttributionModel,
  timeWindow,
  onTimeWindow,
}: {
  attributionModel: AttributionModel;
  onAttributionModel: (model: AttributionModel) => void;
  timeWindow: TimeWindow;
  onTimeWindow: (window: TimeWindow) => void;
}) {
  const selectClass =
    'rounded-input border border-border bg-surface px-3 py-1.5 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent';
  const labelClass = 'text-body-sm text-fg-secondary font-medium';

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-h3 font-bold text-fg">
            Центр конверсійної інтелектуальності (ANL-CONV-01)
          </h3>
          <p className="text-body text-fg-muted">
            Глибокий аналіз атрибуції, відтоку на чекауті та поведінкових воронок FADE
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={labelClass}>Атрибуція:</span>
            <select
              value={attributionModel}
              onChange={(event) => onAttributionModel(event.target.value as AttributionModel)}
              className={selectClass}
            >
              <option value="last-click">Last-Click (Останній клік)</option>
              <option value="first_click">First-Click (Перший клік)</option>
              <option value="linear">Linear (Лінійна)</option>
              <option value="time-decay">Time-Decay (Згасання у часі)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className={labelClass}>Період:</span>
            <select
              value={timeWindow}
              onChange={(event) => onTimeWindow(event.target.value as TimeWindow)}
              className={selectClass}
            >
              <option value="30d">Останні 30 днів</option>
              <option value="90d">Останні 90 днів</option>
              <option value="12m">Останні 12 місяців</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
