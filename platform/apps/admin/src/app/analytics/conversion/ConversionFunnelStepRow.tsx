import { heatmapTone, type FunnelStepData } from './conversion-funnel-steps';

export default function ConversionFunnelStepRow({ step }: { step: FunnelStepData }) {
  return (
    <div className="p-4 rounded-card border border-line bg-surface flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-display font-bold flex items-center justify-center shrink-0">
          {step.stepNumber}
        </div>
        <div className="flex flex-col">
          <span className="font-display font-semibold text-fg text-body">{step.stepName}</span>
          <span className="text-body-sm text-fg-secondary">
            Користувачів: <strong className="text-fg">{step.usersCount.toLocaleString()}</strong> •
            Середній час: {step.avgDurationSeconds} сек
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-body-sm text-fg-secondary">Конверсія кроку</span>
          <span className="font-display font-bold text-fg text-h4">{step.conversionRate}%</span>
        </div>
        <div
          className={`px-3 py-1.5 rounded-pill border text-body-sm font-medium ${heatmapTone(step.dropOffRate)}`}
        >
          {step.dropOffRate === 0 ? 'Старт воронки' : `Відтік: -${step.dropOffRate}%`}
        </div>
      </div>
    </div>
  );
}
