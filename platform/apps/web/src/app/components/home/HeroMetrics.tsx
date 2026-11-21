const METRICS = [
  { value: '2 крісла', label: 'Приватність і тиша' },
  { value: '60 сек', label: 'Миттєвий запис' },
  { value: '600 ₴', label: 'Перша стрижка' },
  { value: 'Ритуал', label: 'Гарячий рушник' },
];

export function HeroMetrics() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-5 border-t border-line/90 pt-8 sm:grid-cols-4 w-full">
      {METRICS.map((metric) => (
        <div
          key={metric.label}
          className="space-y-1.5 p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line-strong backdrop-blur-md shadow-lg hover:border-accent-blue hover:bg-surface-sunken hover:scale-[1.02] transition-all duration-300 group/metric"
        >
          <div className="text-h4 font-display font-bold text-fg group-hover/metric:text-accent-blue transition-colors">
            {metric.value}
          </div>
          <div className="text-caption text-fg-muted uppercase font-semibold tracking-wider">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}
