interface ConversionMetricsProps {
  startedCount: number;
  completedCount: number;
}

export function ConversionMetrics({ startedCount, completedCount }: ConversionMetricsProps) {
  const metrics = [
    { label: 'Старти воронки (БХ-1)', value: startedCount, hint: '+12.4% за тиждень' },
    { label: 'Успішні записи (БХ-6)', value: completedCount, hint: 'Високий retention' },
    { label: 'Середній час кроку', value: '38 сек', hint: 'Оптимально (<45с)' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-surface border border-line rounded-[var(--radius-card)] p-4 flex flex-col justify-between shadow-sm"
        >
          <span className="text-xs font-medium text-fg-secondary uppercase tracking-wider">
            {metric.label}
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold font-display text-fg">{metric.value}</span>
            <span className="text-xs text-accent font-medium">{metric.hint}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
