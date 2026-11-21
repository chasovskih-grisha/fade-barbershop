export default function PricingImpactBanner({ active, total }: { active: number; total: number }) {
  const metrics = [
    { label: 'Активних правил оптимізації', value: `${active} / ${total}`, tone: 'text-fg' },
    {
      label: 'Прогнозований приріст AOV',
      value: `+${(active * 14.5).toFixed(1)}%`,
      tone: 'text-semantic-success',
    },
    {
      label: 'Орієнтовний додатковий місячний дохід',
      value: `+${(active * 38500).toLocaleString()} ₴`,
      tone: 'text-fg',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 rounded-input bg-surface-sunken p-4 border border-line">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col">
          <span className="text-caption text-fg-muted">{metric.label}</span>
          <span className={`font-display text-h3 font-bold ${metric.tone}`}>{metric.value}</span>
        </div>
      ))}
    </div>
  );
}
